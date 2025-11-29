import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getProductById, updateRecord, deleteRecord } from "@/lib/database";

async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const product = await getProductById(id);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Product GET error:", error);

    if (error?.message?.includes("No rows")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Product not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

async function handlePATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    const user = (request as any).user;

    // Validate slug format if provided
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Slug can only contain lowercase letters, numbers, and hyphens",
          },
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      ...data,
      updated_by: user.id,
    };

    // Ensure array fields are properly formatted
    if (updateData.how_to_use !== undefined) {
      updateData.how_to_use = Array.isArray(updateData.how_to_use) ? updateData.how_to_use : [];
    }
    if (updateData.benefits !== undefined) {
      updateData.benefits = Array.isArray(updateData.benefits) ? updateData.benefits : [];
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.images; // Images are handled separately via product_images table

    const updatedProduct = await updateRecord("products", id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error("Product PATCH error:", error);

    if (error?.message?.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A product with this SKU already exists",
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deleteRecord("products", id);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = createAuthenticatedHandler(handleGET);
export const PATCH = createAuthenticatedHandler(handlePATCH);
export const DELETE = createAuthenticatedHandler(handleDELETE);
