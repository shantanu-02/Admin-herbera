import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getProductById, updateRecord, deleteRecord } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase";

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

    // Extract images to handle separately
    const newImages = data.images;

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
    if (updateData.skin_concerns !== undefined) {
      updateData.skin_concerns = Array.isArray(updateData.skin_concerns) ? updateData.skin_concerns : [];
    }
    if (updateData.skin_types !== undefined) {
      updateData.skin_types = Array.isArray(updateData.skin_types) ? updateData.skin_types : [];
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.images; // Images are handled separately via product_images table

    const updatedProduct = await updateRecord("products", id, updateData);

    // Handle Image Updates
    if (newImages && Array.isArray(newImages)) {
      // 1. Get existing images
      const { data: existingImages, error: fetchError } = await supabaseAdmin!
        .from("product_images")
        .select("*")
        .eq("product_id", id);

      if (fetchError) {
        console.error("Error fetching existing images:", fetchError);
      } else {
        // 2. Identify images to delete
        const newImageUrls = new Set(newImages.map((img: any) => img.url));
        const imagesToDelete =
          existingImages?.filter((img) => !newImageUrls.has(img.url)) || [];

        // 3. Delete removed images
        for (const img of imagesToDelete) {
          // Delete from DB
          const { error: deleteDbError } = await supabaseAdmin!
            .from("product_images")
            .delete()
            .eq("id", img.id);

          if (deleteDbError) {
            console.error("Error deleting image from DB:", deleteDbError);
          }

          // Delete from Storage
          try {
            // Extract path from URL
            // URL format: .../storage/v1/object/public/[bucket]/[path]
            // We assume bucket is 'product-images' as seen in frontend
            const bucketName = "product-images";
            if (img.url.includes(bucketName)) {
              const urlParts = img.url.split(`/${bucketName}/`);
              if (urlParts.length > 1) {
                const storagePath = urlParts[1];
                const { error: storageError } = await supabaseAdmin!.storage
                  .from(bucketName)
                  .remove([storagePath]);
                
                if (storageError) {
                  console.error("Error deleting from storage:", storageError);
                }
              }
            }
          } catch (e) {
            console.error("Error deleting image from storage:", e);
          }
        }

        // 4. Upsert new/updated images
        for (let index = 0; index < newImages.length; index++) {
          const img = newImages[index];
          const existing = existingImages?.find((e) => e.url === img.url);

          if (existing) {
            // Update existing
            const { error: updateError } = await supabaseAdmin!
              .from("product_images")
              .update({
                alt_text: img.alt_text,
                sort_order: index, // Update sort order based on array position
              })
              .eq("id", existing.id);
            
            if (updateError) {
              console.error("Error updating image:", updateError);
            }
          } else {
            // Insert new
            const { error: insertError } = await supabaseAdmin!.from("product_images").insert({
              product_id: id,
              url: img.url,
              alt_text: img.alt_text,
              sort_order: index,
            });

            if (insertError) {
              console.error("Error inserting image:", insertError);
            }
          }
        }
      }
    }

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
