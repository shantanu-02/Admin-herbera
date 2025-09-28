"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload, ProductImage } from "@/components/ui/image-upload";
import { generateSlug } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  stock: number;
  rating: number;
  is_active: boolean;
  sku: string;
  ingredients: string[];
  weight_kg: number;
  length_cm: number;
  breadth_cm: number;
  height_cm: number;
  discount_percent: number;
  images: ProductImage[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category_id: "",
    price: "",
    stock: "",
    sku: "",
    ingredients: [] as string[],
    weight_kg: "",
    length_cm: "",
    breadth_cm: "",
    height_cm: "",
    discount_percent: "",
    is_active: true,
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [newIngredient, setNewIngredient] = useState("");

  const fetchProduct = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const productData = data.data;

        setProduct(productData);
        setFormData({
          name: productData.name || "",
          slug: productData.slug || "",
          description: productData.description || "",
          category_id: productData.category_id || "",
          price: productData.price?.toString() || "",
          stock: productData.stock?.toString() || "",
          sku: productData.sku || "",
          ingredients: productData.ingredients || [],
          weight_kg: productData.weight_kg?.toString() || "",
          length_cm: productData.length_cm?.toString() || "",
          breadth_cm: productData.breadth_cm?.toString() || "",
          height_cm: productData.height_cm?.toString() || "",
          discount_percent: productData.discount_percent?.toString() || "0",
          is_active: productData.is_active ?? true,
        });

        // Set images
        if (productData.images && productData.images.length > 0) {
          setImages(
            productData.images.map((img: any) => ({
              url: img.url,
              alt_text: img.alt_text || "",
              sort_order: img.sort_order || 0,
            }))
          );
        }
      } else {
        toast.error("Failed to fetch product");
        router.push("/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to fetch product");
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const response = await fetch("/api/admin/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [fetchProduct, fetchCategories]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()],
      }));
      setNewIngredient("");
    }
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category_id || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate slug format
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    setIsSubmitting(true);
    setIsUploadingImages(true);

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      // Upload images first
      let uploadedImages: any[] = [];
      if (images.length > 0) {
        const filesToUpload = images
          .filter((img) => img.file)
          .map((img) => img.file!);

        if (filesToUpload.length > 0) {
          // Upload via API endpoint
          const formDataUpload = new FormData();
          filesToUpload.forEach((file) => {
            formDataUpload.append("files", file);
          });
          formDataUpload.append("bucket", "product-images");
          formDataUpload.append("folder", "products");

          const uploadResponse = await fetch("/api/admin/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataUpload,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
              uploadedImages = images.map((img, index) => {
                if (img.file) {
                  const uploadResult = uploadData.data.find(
                    (result: any) => result.originalName === img.file!.name
                  );
                  return {
                    url: uploadResult?.url || img.url,
                    alt_text: img.alt_text,
                    sort_order: img.sort_order,
                  };
                }
                return {
                  url: img.url,
                  alt_text: img.alt_text,
                  sort_order: img.sort_order,
                };
              });
            } else {
              console.error("Upload failed:", uploadData.error);
              toast.error("Failed to upload images");
            }
          } else {
            console.error("Upload request failed");
            toast.error("Failed to upload images");
          }
        } else {
          // Use existing images
          uploadedImages = images.map((img) => ({
            url: img.url,
            alt_text: img.alt_text,
            sort_order: img.sort_order,
          }));
        }
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
          breadth_cm: formData.breadth_cm
            ? parseFloat(formData.breadth_cm)
            : null,
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
          discount_percent: parseFloat(formData.discount_percent),
          slug: formData.slug || null, // Allow null to trigger auto-generation
          images: uploadedImages,
        }),
      });

      if (response.ok) {
        toast.success("Product updated successfully!");
        router.push("/products");
      } else {
        const error = await response.json();
        toast.error(error.error?.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/products")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    handleInputChange("slug", e.target.value)
                  }
                  placeholder="url-friendly-slug"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Used for SEO-friendly URLs. Leave empty to auto-generate from product name.
                </p>
                {formData.slug && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="font-medium">URL Preview:</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-800 font-mono bg-white p-2 rounded border">
                      /products/{formData.slug}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    handleInputChange("category_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  placeholder="Enter SKU"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="discount_percent">Discount %</Label>
                <Input
                  id="discount_percent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) =>
                    handleInputChange("discount_percent", e.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    handleInputChange("is_active", e.target.checked)
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle>Dimensions (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.01"
                  value={formData.weight_kg}
                  onChange={(e) =>
                    handleInputChange("weight_kg", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="length_cm">Length (cm)</Label>
                <Input
                  id="length_cm"
                  type="number"
                  step="0.01"
                  value={formData.length_cm}
                  onChange={(e) =>
                    handleInputChange("length_cm", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="breadth_cm">Breadth (cm)</Label>
                <Input
                  id="breadth_cm"
                  type="number"
                  step="0.01"
                  value={formData.breadth_cm}
                  onChange={(e) =>
                    handleInputChange("breadth_cm", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  step="0.01"
                  value={formData.height_cm}
                  onChange={(e) =>
                    handleInputChange("height_cm", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  placeholder="Enter ingredient"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addIngredient())
                  }
                />
                <Button type="button" onClick={addIngredient}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                  >
                    <span className="text-sm">{ingredient}</span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={10}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/products")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || isUploadingImages}>
            {submitting ? (
              "Updating..."
            ) : isUploadingImages ? (
              "Uploading Images..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
