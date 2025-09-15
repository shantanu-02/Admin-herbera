import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

async function handlePOST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message:
              "Supabase admin client not configured. Please check your environment variables.",
          },
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const bucket = (formData.get("bucket") as string) || "product-images";
    const folder = (formData.get("folder") as string) || "products";

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "No files provided",
          },
        },
        { status: 400 }
      );
    }

    const uploadResults = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Convert File to Buffer for server-side upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload file to Supabase Storage using admin client
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .upload(filePath, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          console.error(`Error details:`, JSON.stringify(error, null, 2));
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(filePath);

        console.log(`Upload successful for ${file.name}:`, {
          url: urlData.publicUrl,
          path: filePath,
          name: fileName,
        });

        uploadResults.push({
          url: urlData.publicUrl,
          path: filePath,
          name: fileName,
          originalName: file.name,
        });
      } catch (fileError) {
        console.error(`Error uploading ${file.name}:`, fileError);
        continue;
      }
    }

    if (uploadResults.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPLOAD_FAILED",
            message: "All file uploads failed",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: uploadResults,
    });
  } catch (error) {
    console.error("Upload API error:", error);
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

export const POST = createAuthenticatedHandler(handlePOST);
