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
import { ArrowLeft, Save, Upload, X, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PartnerFormData {
  name: string;
  bio: string;
  photo_url: string;
  photo_alt: string;
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  tiktok_url: string;
  other_social_links: any;
  sales_count: number;
  revenue_generated: number;
  month_year: string;
  is_active: boolean;
  featured_quote: string;
  achievements: string[];
}

export default function NewPartnerPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PartnerFormData>({
    name: "",
    bio: "",
    photo_url: "",
    photo_alt: "",
    instagram_url: "",
    facebook_url: "",
    twitter_url: "",
    youtube_url: "",
    tiktok_url: "",
    other_social_links: {},
    sales_count: 0,
    revenue_generated: 0,
    month_year: "",
    is_active: true,
    featured_quote: "",
    achievements: [],
  });
  const [achievementInput, setAchievementInput] = useState("");
  const router = useRouter();

  const handleInputChange = (field: keyof PartnerFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addAchievement = useCallback(() => {
    if (
      achievementInput.trim() &&
      !formData.achievements.includes(achievementInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        achievements: [...prev.achievements, achievementInput.trim()],
      }));
      setAchievementInput("");
    }
  }, [achievementInput, formData.achievements]);

  const removeAchievement = useCallback((achievementToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter(
        (achievement) => achievement !== achievementToRemove
      ),
    }));
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      console.log("Starting partner image upload for file:", file.name);

      const formData = new FormData();
      formData.append("files", file);
      formData.append("bucket", "product-images");
      formData.append("folder", "partners");

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
            "Upload successful, setting photo URL:",
            data.data[0].url
          );
          handleInputChange("photo_url", data.data[0].url);
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

      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Partner created successfully");
        router.push("/partners");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || "Failed to create partner");
      }
    } catch (error) {
      toast.error("Failed to create partner");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();

    for (let i = 0; i < 24; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      options.push({ value, label });
    }

    return options;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/partners")}
                variant="ghost"
                size="sm"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Partners
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  New Partner of Month
                </h1>
                <p className="text-gray-600 mt-1">
                  Add a new top-performing social media influencer
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
                Enter the basic details for the partner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter partner's name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Enter partner's bio and background"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="featured_quote">Featured Quote</Label>
                <Textarea
                  id="featured_quote"
                  value={formData.featured_quote}
                  onChange={(e) =>
                    handleInputChange("featured_quote", e.target.value)
                  }
                  placeholder="Enter a featured quote from the partner"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Photo</CardTitle>
              <CardDescription>Add a photo of the partner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.photo_url ? (
                <div className="space-y-4">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                    <Image
                      src={formData.photo_url}
                      alt={formData.photo_alt || formData.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleInputChange("photo_url", "")}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Upload partner photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("photo-upload")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="photo_alt">Photo Alt Text</Label>
                <Input
                  id="photo_alt"
                  value={formData.photo_alt}
                  onChange={(e) =>
                    handleInputChange("photo_alt", e.target.value)
                  }
                  placeholder="Describe the photo for accessibility"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Add the partner&apos;s social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) =>
                      handleInputChange("instagram_url", e.target.value)
                    }
                    placeholder="https://instagram.com/username"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) =>
                      handleInputChange("facebook_url", e.target.value)
                    }
                    placeholder="https://facebook.com/username"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter_url">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    type="url"
                    value={formData.twitter_url}
                    onChange={(e) =>
                      handleInputChange("twitter_url", e.target.value)
                    }
                    placeholder="https://twitter.com/username"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input
                    id="youtube_url"
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) =>
                      handleInputChange("youtube_url", e.target.value)
                    }
                    placeholder="https://youtube.com/@username"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tiktok_url">TikTok URL</Label>
                  <Input
                    id="tiktok_url"
                    type="url"
                    value={formData.tiktok_url}
                    onChange={(e) =>
                      handleInputChange("tiktok_url", e.target.value)
                    }
                    placeholder="https://tiktok.com/@username"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Enter the partner&apos;s performance data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sales_count">Sales Count</Label>
                  <Input
                    id="sales_count"
                    type="number"
                    value={formData.sales_count}
                    onChange={(e) =>
                      handleInputChange(
                        "sales_count",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    min="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="revenue_generated">
                    Revenue Generated (₹)
                  </Label>
                  <Input
                    id="revenue_generated"
                    type="number"
                    value={formData.revenue_generated}
                    onChange={(e) =>
                      handleInputChange(
                        "revenue_generated",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="month_year">Month & Year *</Label>
                <Select
                  value={formData.month_year}
                  onValueChange={(value) =>
                    handleInputChange("month_year", value)
                  }
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select month and year" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonthYearOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>
                Add the partner&apos;s key achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  placeholder="Enter an achievement"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAchievement();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addAchievement}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              {formData.achievements.length > 0 && (
                <div className="space-y-2">
                  {formData.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg flex items-center justify-between"
                    >
                      <span>{achievement}</span>
                      <button
                        type="button"
                        onClick={() => removeAchievement(achievement)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Configure the partner&apos;s visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_active", checked)
                  }
                />
                <Label htmlFor="is_active">Active Partner</Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/partners")}
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
                  Create Partner
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
