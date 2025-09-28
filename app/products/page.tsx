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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ArrowLeft,
  Package,
  Star,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
  price: number;
  discount_percent: number;
  stock: number;
  rating: number;
  is_active: boolean;
  sku: string;
  created_at: string;
  updated_at: string;
  images: Array<{
    id: string;
    url: string;
    alt_text: string;
    sort_order: number;
  }>;
  variants_count: number;
  reviews_count: number;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const url = new URL("/api/admin/products", window.location.origin);
      if (searchQuery) url.searchParams.append("q", searchQuery);
      if (selectedCategory && selectedCategory !== "all")
        url.searchParams.append("category_id", selectedCategory);
      if (activeFilter && activeFilter !== "all")
        url.searchParams.append("is_active", activeFilter);
      if (sortBy && sortBy !== "default")
        url.searchParams.append("sort", sortBy);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, activeFilter, sortBy, router]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const toggleProductStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(
          `Product ${!currentStatus ? "activated" : "deactivated"} successfully`
        );
        fetchProducts();
      } else {
        toast.error("Failed to update product status");
      }
    } catch (error) {
      toast.error("Failed to update product status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
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
                onClick={() => router.push("/")}
                variant="ghost"
                size="sm"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-600 mt-1">
                  Manage your product catalog
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/products/new")}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48 h-12">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-full lg:w-32 h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="created_desc">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="rating_desc">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="relative">
                {product.images?.length > 0 && product.images[0]?.url ? (
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt_text || product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => router.push(`/products/${product.id}`)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-600 hover:text-emerald-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() =>
                        router.push(`/products/${product.id}/edit`)
                      }
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-600 hover:text-emerald-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(product.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {product.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{product.category?.name || "No Category"}</span>
                      <span>•</span>
                      <span>SKU: {product.sku || "N/A"}</span>
                    </div>
                    {product.slug && (
                      <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded mt-1">
                        /{product.slug}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                  {product.description || "No description available"}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-emerald-600">
                      ₹{product.price || 0}
                    </span>
                    {(product.discount_percent || 0) > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        -{product.discount_percent}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium text-gray-700">
                      {product.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({product.reviews_count || 0})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Stock: {product.stock || 0}</span>
                  <span>{product.variants_count || 0} variants</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() =>
                      toggleProductStatus(product.id, product.is_active)
                    }
                    variant={product.is_active ? "outline" : "default"}
                    size="sm"
                    className="flex-1"
                  >
                    {product.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory || activeFilter
                  ? "No products match your current filters."
                  : "Get started by adding your first product."}
              </p>
              {!searchQuery && !selectedCategory && !activeFilter && (
                <Button
                  onClick={() => router.push("/products/new")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
