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
  Search,
  ArrowLeft,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  featured_image_alt?: string;
  author_id: string;
  status: string;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [featuredFilter, setFeaturedFilter] = useState<string>("");
  const router = useRouter();

  const fetchBlogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const url = new URL("/api/admin/blogs", window.location.origin);
      if (statusFilter && statusFilter !== "all")
        url.searchParams.append("status", statusFilter);
      if (featuredFilter && featuredFilter !== "all")
        url.searchParams.append("featured", featuredFilter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredBlogs = data.data;

        // Apply client-side search filter
        if (searchQuery) {
          const searchTerm = searchQuery.toLowerCase();
          filteredBlogs = filteredBlogs.filter(
            (blog: Blog) =>
              blog.title.toLowerCase().includes(searchTerm) ||
              blog.excerpt?.toLowerCase().includes(searchTerm) ||
              blog.profiles?.full_name?.toLowerCase().includes(searchTerm)
          );
        }

        setBlogs(filteredBlogs);
      } else {
        toast.error("Failed to fetch blogs");
      }
    } catch (error) {
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, featuredFilter, searchQuery, router]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        variant: "secondary" as const,
        color: "text-gray-600",
      },
      published: {
        variant: "default" as const,
        color: "text-green-600",
      },
      archived: {
        variant: "destructive" as const,
        color: "text-red-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge variant={config.variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  const deleteBlog = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
        toast.success("Blog deleted successfully");
      } else {
        toast.error("Failed to delete blog");
      }
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blogs...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
                <p className="text-gray-600 mt-1">
                  Manage your blog content and articles
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/blogs/new")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Blog Post
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
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="All Posts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="true">Featured</SelectItem>
              <SelectItem value="false">Regular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Blogs List */}
        <div className="space-y-6">
          {blogs.map((blog) => (
            <Card
              key={blog.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {blog.title}
                      </CardTitle>
                      {getStatusBadge(blog.status)}
                      {blog.is_featured && (
                        <Badge
                          variant="outline"
                          className="text-yellow-600 border-yellow-200"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {blog.profiles?.full_name ||
                          blog.profiles?.email ||
                          "Unknown Author"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {blog.published_at
                          ? new Date(blog.published_at).toLocaleDateString()
                          : new Date(blog.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {blog.view_count} views
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => router.push(`/blogs/${blog.id}`)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-emerald-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => router.push(`/blogs/${blog.id}/edit`)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteBlog(blog.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Featured Image */}
                  {blog.featured_image_url && (
                    <div className="lg:col-span-1">
                      <div className="aspect-video relative overflow-hidden rounded-lg">
                        <Image
                          src={blog.featured_image_url}
                          alt={blog.featured_image_alt || blog.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div
                    className={
                      blog.featured_image_url
                        ? "lg:col-span-2"
                        : "lg:col-span-3"
                    }
                  >
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">
                        {blog.excerpt || blog.content.substring(0, 200) + "..."}
                      </p>
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Meta Information */}
                    <div className="text-sm text-gray-500 space-y-1">
                      {blog.meta_title && (
                        <div>
                          <span className="font-medium">Meta Title:</span>{" "}
                          {blog.meta_title}
                        </div>
                      )}
                      {blog.meta_description && (
                        <div>
                          <span className="font-medium">Meta Description:</span>{" "}
                          {blog.meta_description}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Slug:</span> {blog.slug}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {blogs.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No blog posts found
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter || featuredFilter
                  ? "No blog posts match your current filters."
                  : "Start creating your first blog post to engage with your audience."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
