import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { updateRecord, deleteRecord } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase";

async function handlePATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    const user = (request as any).user;

    // Validate updates
    if (
      updates.price !== undefined &&
      (typeof updates.price !== "number" || updates.price <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Price must be a positive number",
          },
        },
        { status: 400 }
      );
    }

    if (
      updates.stock !== undefined &&
      (typeof updates.stock !== "number" || updates.stock < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Stock must be a non-negative number",
          },
        },
        { status: 400 }
      );
    }

    // Check if variant exists and get current SKU
    const { data: currentVariant, error: fetchError } = await supabaseAdmin!
      .from("product_variants")
      .select("sku")
      .eq("id", id)
      .single();

    if (fetchError || !currentVariant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Variant not found",
          },
        },
        { status: 404 }
      );
    }

    // Check if SKU already exists (if being updated)
    if (updates.sku && updates.sku !== currentVariant.sku) {
      const { data: existingVariant, error: checkError } =
        await supabaseAdmin!
          .from("product_variants")
          .select("id")
          .eq("sku", updates.sku)
          .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" which is what we want
        console.error("Error checking SKU:", checkError);
        throw checkError;
      }

      if (existingVariant) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "A variant with this SKU already exists",
            },
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.product_id;
    delete updateData.created_at;
    delete updateData.created_by;

    // Update variant
    const updatedVariant = await updateRecord("product_variants", id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedVariant,
    });
  } catch (error: any) {
    console.error("Variant PATCH error:", error);

    // Handle unique constraint violation
    if (error?.code === "23505" || error?.message?.includes("unique")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A variant with this SKU already exists",
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

    // Check if variant exists
    const { data: variant, error: fetchError } = await supabaseAdmin!
      .from("product_variants")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !variant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Variant not found",
          },
        },
        { status: 404 }
      );
    }

    // Delete variant
    await deleteRecord("product_variants", id);

    return NextResponse.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error("Variant DELETE error:", error);
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

export const PATCH = createAuthenticatedHandler(handlePATCH);
export const DELETE = createAuthenticatedHandler(handleDELETE);
