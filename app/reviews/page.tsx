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
import { Search, ArrowLeft, Star, Check, X, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  title: string;
  review_text: string;
  rating: number;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const fetchReviews = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const url = new URL("/api/admin/reviews", window.location.origin);
      if (approvalFilter && approvalFilter !== "all")
        url.searchParams.append("is_approved", approvalFilter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredReviews = data.data;

        // Apply client-side filters
        if (searchQuery) {
          const searchTerm = searchQuery.toLowerCase();
          filteredReviews = filteredReviews.filter(
            (review: Review) =>
              review.title.toLowerCase().includes(searchTerm) ||
              review.review_text.toLowerCase().includes(searchTerm) ||
              review.product.name.toLowerCase().includes(searchTerm) ||
              review.user.email.toLowerCase().includes(searchTerm)
          );
        }

        if (ratingFilter && ratingFilter !== "all") {
          const targetRating = parseInt(ratingFilter);
          filteredReviews = filteredReviews.filter(
            (review: Review) => review.rating === targetRating
          );
        }

        setReviews(filteredReviews);
      } else {
        toast.error("Failed to fetch reviews");
      }
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [approvalFilter, ratingFilter, searchQuery, router]);

  const handleApproval = async (reviewId: string, isApproved: boolean) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_approved: isApproved }),
      });

      if (response.ok) {
        toast.success(
          `Review ${isApproved ? "approved" : "rejected"} successfully`
        );
        fetchReviews();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to update review");
      }
    } catch (error) {
      toast.error("Failed to update review");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Review deleted successfully");
        fetchReviews();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to delete review");
      }
    } catch (error) {
      toast.error("Failed to delete review");
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

  const getApprovalBadge = (isApproved: boolean) => {
    return (
      <Badge variant={isApproved ? "default" : "secondary"}>
        {isApproved ? "Approved" : "Pending"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
                <p className="text-gray-600 mt-1">
                  Moderate customer reviews and feedback
                </p>
              </div>
            </div>
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
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="All Reviews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="true">Approved</SelectItem>
              <SelectItem value="false">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full lg:w-32 h-12">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      {getApprovalBadge(review.is_approved)}
                      {review.is_verified_purchase && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {review.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Product: {review.product.name}</span>
                      <span>•</span>
                      <span>By: {review.user.email}</span>
                      <span>•</span>
                      <span>
                        Posted:{" "}
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!review.is_approved && (
                      <>
                        <Button
                          onClick={() => handleApproval(review.id, true)}
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleApproval(review.id, false)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleDelete(review.id)}
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
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">
                    {review.review_text}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{review.helpful_count} people found this helpful</span>
                  <div className="flex items-center space-x-4">
                    {review.is_approved ? (
                      <Button
                        onClick={() => handleApproval(review.id, false)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleApproval(review.id, true)}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reviews found
              </h3>
              <p className="text-gray-600">
                {searchQuery || approvalFilter || ratingFilter
                  ? "No reviews match your current filters."
                  : "Reviews will appear here when customers start leaving feedback."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
