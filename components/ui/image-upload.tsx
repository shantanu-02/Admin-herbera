"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  X,
  GripVertical,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  validateImageFile,
  createImagePreview,
  revokeImagePreview,
} from "@/lib/storage";
import Image from "next/image";

export interface ProductImage {
  id?: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  file?: File;
  preview?: string;
}

interface ImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const newImages: ProductImage[] = acceptedFiles
        .map((file, index) => {
          const validation = validateImageFile(file);
          if (!validation.valid) {
            toast.error(validation.error);
            return null;
          }

          return {
            url: "",
            alt_text: "",
            sort_order: images.length + index,
            file,
            preview: createImagePreview(file),
          };
        })
        .filter(Boolean) as ProductImage[];

      onImagesChange([...images, ...newImages]);
    },
    [images, maxImages, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
    disabled: isUploading || images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    if (imageToRemove.preview) {
      revokeImagePreview(imageToRemove.preview);
    }

    const newImages = images.filter((_, i) => i !== index);
    // Reorder sort_order
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sort_order: i,
    }));
    onImagesChange(reorderedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);

    // Update sort_order
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sort_order: i,
    }));
    onImagesChange(reorderedImages);
  };

  const updateAltText = (index: number, altText: string) => {
    const newImages = [...images];
    newImages[index].alt_text = altText;
    onImagesChange(newImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragActive
                ? "Drop images here..."
                : "Drag & drop images here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP up to 5MB each
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {images.length} / {maxImages} images
          </Badge>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Images
            </h4>
            <p className="text-xs text-gray-500">
              Drag to reorder • First image will be the main image
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={image.preview || image.url}
                      alt={image.alt_text || `Product image ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error("Image load error:", e);
                      }}
                    />

                    {/* Sort Order Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant={index === 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {index === 0 ? "Main" : index + 1}
                      </Badge>
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>

                    {/* Drag Handle */}
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded p-1">
                        <GripVertical className="w-3 h-3 text-gray-600" />
                      </div>
                    </div>
                  </div>

                  {/* Alt Text Input */}
                  <div className="mt-2">
                    <Label
                      htmlFor={`alt-${index}`}
                      className="text-xs text-gray-600"
                    >
                      Alt Text
                    </Label>
                    <Input
                      id={`alt-${index}`}
                      value={image.alt_text || ""}
                      onChange={(e) => updateAltText(index, e.target.value)}
                      placeholder="Describe this image..."
                      className="h-8 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
          <span>Uploading images...</span>
        </div>
      )}

      {/* Help Text */}
      <div className="flex items-start space-x-2 text-xs text-gray-500">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p>• The first image will be used as the main product image</p>
          <p>• Images will be automatically optimized for web</p>
          <p>• Supported formats: JPEG, PNG, WebP (max 5MB each)</p>
        </div>
      </div>
    </div>
  );
}
