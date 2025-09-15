import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getCategories, createRecord } from "@/lib/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getCategories({
      q,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit,
        offset,
        has_more: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Categories GET error:", error);
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

async function handlePOST(request: NextRequest) {
  try {
    const data = await request.json();
    const user = (request as any).user;

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Category name is required",
          },
        },
        { status: 400 }
      );
    }

    const categoryData = {
      name: data.name,
      description: data.description || null,
      created_by: user.id,
      updated_by: user.id,
    };

    const newCategory = await createRecord("categories", categoryData);

    return NextResponse.json({
      success: true,
      data: newCategory,
    });
  } catch (error: any) {
    console.error("Categories POST error:", error);

    if (error?.message?.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A category with this name or slug already exists",
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

export const GET = createAuthenticatedHandler(handleGET);
export const POST = createAuthenticatedHandler(handlePOST);
