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
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Partner {
  id: string;
  name: string;
  bio?: string;
  photo_url?: string;
  photo_alt?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  other_social_links?: any;
  sales_count: number;
  revenue_generated: number;
  month_year: string;
  is_active: boolean;
  featured_quote?: string;
  achievements?: string[];
  created_at: string;
  updated_at: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const router = useRouter();

  const fetchPartners = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const url = new URL("/api/admin/partners", window.location.origin);
      if (monthFilter && monthFilter !== "all")
        url.searchParams.append("month_year", monthFilter);
      if (activeFilter && activeFilter !== "all")
        url.searchParams.append("active", activeFilter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredPartners = data.data;

        // Apply client-side search filter
        if (searchQuery) {
          const searchTerm = searchQuery.toLowerCase();
          filteredPartners = filteredPartners.filter(
            (partner: Partner) =>
              partner.name.toLowerCase().includes(searchTerm) ||
              partner.bio?.toLowerCase().includes(searchTerm) ||
              partner.featured_quote?.toLowerCase().includes(searchTerm)
          );
        }

        setPartners(filteredPartners);
      } else {
        toast.error("Failed to fetch partners");
      }
    } catch (error) {
      toast.error("Failed to fetch partners");
    } finally {
      setLoading(false);
    }
  }, [monthFilter, activeFilter, searchQuery, router]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const deletePartner = async (partnerId: string) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPartners((prev) =>
          prev.filter((partner) => partner.id !== partnerId)
        );
        toast.success("Partner deleted successfully");
      } else {
        toast.error("Failed to delete partner");
      }
    } catch (error) {
      toast.error("Failed to delete partner");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading partners...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">
                  Partners of Month
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your top-performing social media influencers
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/partners/new")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Partner
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
              placeholder="Search partners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-full lg:w-48 h-12">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="2024-01">January 2024</SelectItem>
              <SelectItem value="2024-02">February 2024</SelectItem>
              <SelectItem value="2024-03">March 2024</SelectItem>
              <SelectItem value="2024-04">April 2024</SelectItem>
              <SelectItem value="2024-05">May 2024</SelectItem>
              <SelectItem value="2024-06">June 2024</SelectItem>
              <SelectItem value="2024-07">July 2024</SelectItem>
              <SelectItem value="2024-08">August 2024</SelectItem>
              <SelectItem value="2024-09">September 2024</SelectItem>
              <SelectItem value="2024-10">October 2024</SelectItem>
              <SelectItem value="2024-11">November 2024</SelectItem>
              <SelectItem value="2024-12">December 2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Partners List */}
        <div className="space-y-6">
          {partners.map((partner) => (
            <Card
              key={partner.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {partner.name}
                      </CardTitle>
                      <Badge
                        variant={partner.is_active ? "default" : "secondary"}
                      >
                        {partner.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatMonthYear(partner.month_year)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {partner.sales_count} sales
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />₹
                        {partner.revenue_generated.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => router.push(`/partners/${partner.id}`)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-emerald-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() =>
                        router.push(`/partners/${partner.id}/edit`)
                      }
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deletePartner(partner.id)}
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
                  {/* Photo */}
                  {partner.photo_url && (
                    <div className="lg:col-span-1">
                      <div className="aspect-square relative overflow-hidden rounded-lg">
                        <Image
                          src={partner.photo_url}
                          alt={partner.photo_alt || partner.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div
                    className={
                      partner.photo_url ? "lg:col-span-2" : "lg:col-span-3"
                    }
                  >
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">
                        {partner.bio || "No bio available"}
                      </p>
                    </div>

                    {/* Featured Quote */}
                    {partner.featured_quote && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-gray-800 italic">
                          &ldquo;{partner.featured_quote}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Achievements */}
                    {partner.achievements &&
                      partner.achievements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Achievements:
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {partner.achievements.map((achievement, index) => (
                              <li key={index} className="text-sm text-gray-600">
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Social Links */}
                    <div className="flex flex-wrap gap-2">
                      {partner.instagram_url && (
                        <a
                          href={partner.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm hover:bg-pink-200 transition-colors"
                        >
                          Instagram
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      {partner.facebook_url && (
                        <a
                          href={partner.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                        >
                          Facebook
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      {partner.twitter_url && (
                        <a
                          href={partner.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm hover:bg-sky-200 transition-colors"
                        >
                          Twitter
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      {partner.youtube_url && (
                        <a
                          href={partner.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
                        >
                          YouTube
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      {partner.tiktok_url && (
                        <a
                          href={partner.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200 transition-colors"
                        >
                          TikTok
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {partners.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No partners found
              </h3>
              <p className="text-gray-600">
                {searchQuery || monthFilter || activeFilter
                  ? "No partners match your current filters."
                  : "Start adding your top-performing social media influencers."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
