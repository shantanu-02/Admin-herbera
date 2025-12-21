import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getProductById, createRecord } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase";

async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify product exists
    const product = await getProductById(id);
    if (!product) {
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

    // Get variants from database
    const { data: variants, error } = await supabaseAdmin!
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching variants:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: variants || [],
    });
  } catch (error) {
    console.error("Variants GET error:", error);
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

async function handlePOST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { variant_name, sku, price, stock, is_active } = await request.json();
    const user = (request as any).user;

    // Validate input
    if (!variant_name || !sku || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Variant name, SKU, and price are required",
          },
        },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
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

    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
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

    // Verify product exists
    const product = await getProductById(id);
    if (!product) {
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

    // Check if SKU already exists
    const { data: existingVariant, error: checkError } = await supabaseAdmin!
      .from("product_variants")
      .select("id")
      .eq("sku", sku)
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

    // Create new variant
    const newVariant = await createRecord("product_variants", {
      product_id: id,
      variant_name,
      sku,
      price,
      stock: stock ?? 0,
      is_active: is_active !== undefined ? is_active : true,
      created_by: user.id,
      updated_by: user.id,
    });

    return NextResponse.json({
      success: true,
      data: newVariant,
    });
  } catch (error: any) {
    console.error("Variants POST error:", error);
    
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

export const GET = createAuthenticatedHandler(handleGET);
export const POST = createAuthenticatedHandler(handlePOST);
