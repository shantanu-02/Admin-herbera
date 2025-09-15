"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Package,
  Star,
  Eye,
  Edit,
  Trash2,
  Plus,
  Users,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  price: number;
  weight_kg: number;
  length_cm: number;
  breadth_cm: number;
  height_cm: number;
  discount_percent: number;
  stock: number;
  rating: number;
  is_active: boolean;
  sku: string;
  ingredients: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  images: Array<{
    id: string;
    url: string;
    alt_text: string;
    sort_order: number;
    created_at: string;
  }>;
  variants: Array<{
    id: string;
    variant_name: string;
    sku: string;
    price: number;
    stock: number;
    is_active: boolean;
    created_at: string;
  }>;
  reviews: {
    total_count: number;
    approved_count: number;
    pending_count: number;
    average_rating: number;
  };
}

interface Review {
  id: string;
  title: string;
  review_text: string;
  rating: number;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  user: {
    id: string;
    email: string;
  };
}

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data.data);
      } else {
        toast.error("Failed to fetch product details");
        router.push("/products");
      }
    } catch (error) {
      toast.error("Failed to fetch product details");
      router.push("/products");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/products/${productId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        router.push("/products");
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const toggleProductStatus = async () => {
    if (!product) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !product.is_active }),
      });

      if (response.ok) {
        toast.success(
          `Product ${
            !product.is_active ? "activated" : "deactivated"
          } successfully`
        );
        fetchProduct();
      } else {
        toast.error("Failed to update product status");
      }
    } catch (error) {
      toast.error("Failed to update product status");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Product not found
          </h3>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/products")}>
            Back to Products
          </Button>
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
                  {product.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Product Details & Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
              <Button
                onClick={() => router.push(`/products/${productId}/edit`)}
                variant="outline"
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
              <Button
                onClick={toggleProductStatus}
                variant={product.is_active ? "outline" : "default"}
              >
                {product.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                {product?.images?.length > 0 ? (
                  <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt_text}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-emerald-600">
                      ₹{product.price}
                    </span>
                    {product.discount_percent > 0 && (
                      <Badge variant="destructive">
                        -{product.discount_percent}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(Math.floor(product.rating))}
                    <span className="text-sm font-medium text-gray-700 ml-2">
                      {product.rating?.toFixed(1)} ({product.reviews.total_count}{" "}
                      reviews)
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Stock: {product.stock} units</p>
                    <p>SKU: {product.sku}</p>
                    <p>Category: {product.category?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="variants">
                  Variants ({product.variants.length})
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews ({product.reviews.total_count})
                </TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">
                          Dimensions
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Weight:</span>
                            <span>{product.weight_kg} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Length:</span>
                            <span>{product.length_cm} cm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Width:</span>
                            <span>{product.breadth_cm} cm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Height:</span>
                            <span>{product.height_cm} cm</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">
                          Ingredients
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {product.ingredients.map((ingredient, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(product.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Last Updated:</span>{" "}
                          {new Date(product.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Product Variants</CardTitle>
                      <CardDescription>
                        Manage different variants of this product
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() =>
                        router.push(`/products/${productId}/variants/new`)
                      }
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variant
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-gray-900">
                                {variant.variant_name}
                              </h4>
                              <Badge
                                variant={
                                  variant.is_active ? "default" : "secondary"
                                }
                              >
                                {variant.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>SKU: {variant.sku}</span>
                              <span>Price: ₹{variant.price}</span>
                              <span>Stock: {variant.stock}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() =>
                                router.push(
                                  `/products/${productId}/variants/${variant.id}/edit`
                                )
                              }
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {product.variants.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-600 mb-4">
                            No variants found for this product.
                          </p>
                          <Button
                            onClick={() =>
                              router.push(`/products/${productId}/variants/new`)
                            }
                            variant="outline"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Variant
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>
                      {product.reviews.approved_count} approved,{" "}
                      {product.reviews.pending_count} pending review(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="flex items-center space-x-1">
                                  {renderStars(review.rating)}
                                </div>
                                <Badge
                                  variant={
                                    review.is_approved ? "default" : "secondary"
                                  }
                                >
                                  {review.is_approved ? "Approved" : "Pending"}
                                </Badge>
                                {review.is_verified_purchase && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-200"
                                  >
                                    Verified Purchase
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900">
                                {review.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {review.user.email}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">
                            {review.review_text}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                              {review.helpful_count} people found this helpful
                            </span>
                            <span>
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}

                      {reviews.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            No reviews found for this product.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {product.reviews.total_count}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Approved: {product.reviews.approved_count}</div>
                        <div>Pending: {product.reviews.pending_count}</div>
                        <div>
                          Average Rating:{" "}
                          {product.reviews.average_rating.toFixed(1)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Variants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {product.variants.length}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          Active:{" "}
                          {product.variants.filter((v) => v.is_active).length}
                        </div>
                        <div>
                          Total Stock:{" "}
                          {product.variants.reduce(
                            (sum, v) => sum + v.stock,
                            0
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Pricing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        ₹{product.price}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Discount: {product.discount_percent}%</div>
                        <div>
                          Final Price: ₹
                          {Math.round(
                            product.price * (1 - product.discount_percent / 100)
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
