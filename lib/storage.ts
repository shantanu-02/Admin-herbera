import { supabase, supabaseAdmin } from "./supabase";

export interface UploadedImage {
  url: string;
  path: string;
  name: string;
}

export interface ProductImage {
  id?: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  file?: File;
  preview?: string;
}

// Upload a single image to Supabase Storage
export async function uploadImage(
  file: File,
  bucket: string = "product-images",
  folder: string = "products"
): Promise<UploadedImage> {
  try {
    // Use admin client for uploads (server-side)
    if (typeof window === "undefined" && supabaseAdmin) {
      return await uploadImageAdmin(file, bucket, folder);
    }

    // Use public client for uploads (client-side)
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      name: fileName,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

// Admin upload function (server-side)
async function uploadImageAdmin(
  file: File,
  bucket: string,
  folder: string
): Promise<UploadedImage> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not available");
  }

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
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
    name: fileName,
  };
}

// Upload multiple images
export async function uploadImages(
  files: File[],
  bucket: string = "product-images",
  folder: string = "products"
): Promise<UploadedImage[]> {
  try {
    const uploadPromises = files.map((file) =>
      uploadImage(file, bucket, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
}

// Delete an image from Supabase Storage
export async function deleteImage(
  path: string,
  bucket: string = "product-images"
): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

// Generate preview URL for file
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

// Revoke preview URL to free memory
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

// Validate image file
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a valid image file (JPEG, PNG, or WebP)",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Image size must be less than 5MB",
    };
  }

  return { valid: true };
}
