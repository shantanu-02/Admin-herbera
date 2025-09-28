"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/navigation";
import { ImageUpload, ProductImage } from "@/components/ui/image-upload";
import { generateSlug } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category_id: "",
    price: "",
    stock: "",
    sku: "",
    weight_kg: "",
    length_cm: "",
    breadth_cm: "",
    height_cm: "",
    discount_percent: "",
    ingredients: [] as string[],
    is_active: true,
  });
  const [ingredientInput, setIngredientInput] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (formData.name && !formData.slug) {
      handleInputChange("slug", generateSlug(formData.name));
    }
  }, [formData.name, formData.slug]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()],
      }));
      setIngredientInput("");
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

    if (
      !formData.name ||
      !formData.category_id ||
      !formData.price ||
      !formData.sku
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate slug format
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error(
        "Slug can only contain lowercase letters, numbers, and hyphens"
      );
      return;
    }

    setSubmitting(true);
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
          const formData = new FormData();
          filesToUpload.forEach((file) => {
            formData.append("files", file);
          });
          formData.append("bucket", "product-images");
          formData.append("folder", "products");

          const uploadResponse = await fetch("/api/admin/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
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
        }
      }

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 0,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
          breadth_cm: formData.breadth_cm
            ? parseFloat(formData.breadth_cm)
            : null,
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
          discount_percent: parseFloat(formData.discount_percent) || 0,
          images: uploadedImages,
        }),
      });

      if (response.ok) {
        toast.success("Product created successfully!");
        router.push("/products");
      } else {
        const error = await response.json();
        toast.error(error.error?.message || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/products")}
                variant="ghost"
                size="sm"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Add New Product
                </h1>
                <p className="text-gray-600 mt-1">
                  Create a new product in your catalog
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Basic details about your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
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
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to auto-generate from product name. Used for
                      SEO-friendly URLs.
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
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) =>
                          handleInputChange("category_id", value)
                        }
                        required
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
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) =>
                          handleInputChange("sku", e.target.value)
                        }
                        placeholder="Enter SKU"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange("price", e.target.value)
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) =>
                          handleInputChange("stock", e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="discount_percent">
                      Discount Percentage
                    </Label>
                    <Input
                      id="discount_percent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) =>
                        handleInputChange("discount_percent", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Physical Properties */}
              <Card>
                <CardHeader>
                  <CardTitle>Physical Properties</CardTitle>
                  <CardDescription>
                    Dimensions and weight for shipping calculations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="weight_kg">Weight (kg)</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.weight_kg}
                        onChange={(e) =>
                          handleInputChange("weight_kg", e.target.value)
                        }
                        placeholder="0.000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="length_cm">Length (cm)</Label>
                      <Input
                        id="length_cm"
                        type="number"
                        step="0.01"
                        min="0"
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
                        min="0"
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
                        min="0"
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
                  <CardDescription>
                    List the main ingredients of this product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        placeholder="Enter ingredient"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addIngredient())
                        }
                      />
                      <Button
                        type="button"
                        onClick={addIngredient}
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>

                    {formData.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.ingredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{ingredient}</span>
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Product Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>
                    Upload images for your product. The first image will be used
                    as the main product image.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    images={images}
                    onImagesChange={setImages}
                    maxImages={10}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        handleInputChange("is_active", e.target.checked)
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Label htmlFor="is_active">
                      Active (visible to customers)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? "Creating..." : "Create Product"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/products")}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
