"use client";

import { useState, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  featured_image_alt: string;
  status: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  is_featured: boolean;
}

export default function NewBlogPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    featured_image_alt: "",
    status: "draft",
    meta_title: "",
    meta_description: "",
    tags: [],
    is_featured: false,
  });
  const [tagInput, setTagInput] = useState("");
  const router = useRouter();

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Auto-generate slug when title changes
      if (field === "title" && value) {
        const generateSlug = (title: string) => {
          return title
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .trim();
        };
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  }, [tagInput, formData.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      console.log("Starting image upload for file:", file.name);

      const formData = new FormData();
      formData.append("files", file);
      formData.append("bucket", "product-images");
      formData.append("folder", "blogs");

      const token = localStorage.getItem("admin_token");
      console.log("Token exists:", !!token);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);
      console.log("Upload response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Upload response data:", data);

        if (data.success && data.data && data.data.length > 0) {
          console.log(
            "Upload successful, setting image URL:",
            data.data[0].url
          );
          handleInputChange("featured_image_url", data.data[0].url);
          toast.success("Image uploaded successfully");
        } else {
          console.error("Upload failed - invalid response format:", data);
          toast.error("Failed to upload image - invalid response");
        }
      } else {
        const errorData = await response.json();
        console.error("Upload failed with status:", response.status, errorData);
        toast.error(
          `Failed to upload image: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Blog post created successfully");
        router.push("/blogs");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || "Failed to create blog post");
      }
    } catch (error) {
      toast.error("Failed to create blog post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/blogs")}
                variant="ghost"
                size="sm"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blogs
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  New Blog Post
                </h1>
                <p className="text-gray-600 mt-1">
                  Create a new blog post for your audience
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for your blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter blog post title"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="URL-friendly version of the title"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be used in the URL. Leave empty to auto-generate
                  from title.
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange("excerpt", e.target.value)}
                  placeholder="Enter a brief excerpt for your blog post"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Write your blog post content here..."
                  rows={12}
                  required
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>
                Add a featured image for your blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.featured_image_url ? (
                <div className="space-y-4">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden">
                    <Image
                      src={formData.featured_image_url}
                      alt={formData.featured_image_alt || formData.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        handleInputChange("featured_image_url", "")
                      }
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Upload a featured image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="featured_image_alt">Image Alt Text</Label>
                <Input
                  id="featured_image_alt"
                  value={formData.featured_image_alt}
                  onChange={(e) =>
                    handleInputChange("featured_image_alt", e.target.value)
                  }
                  placeholder="Describe the image for accessibility"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help categorize your blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter a tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add Tag
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your blog post for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) =>
                    handleInputChange("meta_title", e.target.value)
                  }
                  placeholder="SEO title for search engines"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) =>
                    handleInputChange("meta_description", e.target.value)
                  }
                  placeholder="SEO description for search engines"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Publishing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
              <CardDescription>
                Configure how and when your blog post will be published
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_featured", checked)
                  }
                />
                <Label htmlFor="is_featured">Featured Post</Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/blogs")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Blog Post
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
