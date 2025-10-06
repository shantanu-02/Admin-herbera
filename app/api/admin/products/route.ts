import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getProducts, createRecord } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const active = searchParams.get("active") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getProducts({
      q,
      category,
      active,
      limit,
      offset,
    });

    // Format the response to match expected structure
    const formattedProducts = result.data.map((product) => ({
      ...product,
      category: {
        id: product.categories?.id,
        name: product.categories?.name,
        slug: product.categories?.slug,
      },
      ingredients: Array.isArray(product.ingredients)
        ? product.ingredients
        : [],
      weight_kg: product.weight_kg || 0,
      length_cm: product.length_cm || 0,
      breadth_cm: product.breadth_cm || 0,
      height_cm: product.height_cm || 0,
      discount_percent: product.discount_percent || 0,
      rating: product.rating || 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        total: result.total,
        limit,
        offset,
        has_more: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Products GET error:", error);
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
    if (
      !data.name ||
      !data.category_id ||
      data.price === null ||
      data.price === undefined ||
      !data.sku
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Name, category_id, price, and sku are required",
          },
        },
        { status: 400 }
      );
    }

    // Prepare product data
    const productData = {
      name: data.name,
      slug: data.slug || null, // Allow null to trigger auto-generation
      description: data.description || null,
      category_id: data.category_id,
      price: parseFloat(data.price),
      stock: parseInt(data.stock) || 0,
      sku: data.sku,
      ingredients: data.ingredients || [],
      weight_kg: data.weight_kg || null,
      length_cm: data.length_cm || null,
      breadth_cm: data.breadth_cm || null,
      height_cm: data.height_cm || null,
      discount_percent: parseFloat(data.discount_percent) || 0,
      is_active: data.is_active !== false,
      created_by: user.id,
      updated_by: user.id,
    };

    const newProduct = await createRecord("products", productData);

    // Handle product images if provided
    if (data.images && data.images.length > 0) {
      console.log("Processing product images:", data.images);
      try {
        const imageInserts = data.images.map((img: any) => ({
          product_id: newProduct.id,
          url: img.url,
          alt_text: img.alt_text || null,
          sort_order: img.sort_order || 0,
        }));

        console.log("Image inserts to be saved:", imageInserts);

        // Insert all images at once
        if (supabaseAdmin) {
          const { error: imageError } = await supabaseAdmin
            .from("product_images")
            .insert(imageInserts);

          if (imageError) {
            console.error("Error inserting product images:", imageError);
            // Don't fail the entire request if images fail
          } else {
            console.log("Product images saved successfully");
          }
        } else {
          console.warn(
            "Supabase admin client not available. Images will not be saved."
          );
        }
      } catch (imageError) {
        console.error("Error handling product images:", imageError);
        // Don't fail the entire request if images fail
      }
    } else {
      console.log("No images provided for product");
    }

    return NextResponse.json({
      success: true,
      data: newProduct,
    });
  } catch (error: any) {
    console.error("Products POST error:", error);

    if (error.message?.includes("duplicate key")) {
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

export const GET = createAuthenticatedHandler(handleGET);
export const POST = createAuthenticatedHandler(handlePOST);
