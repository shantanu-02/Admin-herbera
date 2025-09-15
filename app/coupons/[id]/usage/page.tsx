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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

interface CouponUsageStats {
  total_uses: number;
  usage_limit: number;
  remaining_uses: number;
  total_discount_given: number;
  first_used: string;
  last_used: string;
}

interface RecentUsage {
  id: string;
  order_id: string;
  user_id: string;
  discount_amount: number;
  used_at: string;
}

interface CouponUsageData {
  coupon: {
    id: string;
    code: string;
    name: string;
  };
  usage_stats: CouponUsageStats;
  recent_usage: RecentUsage[];
}

export default function CouponUsagePage() {
  const [usageData, setUsageData] = useState<CouponUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;

  const fetchUsageData = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/admin/coupons/${couponId}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsageData(data.data);
      } else {
        toast.error("Failed to fetch coupon usage data");
        router.push("/coupons");
      }
    } catch (error) {
      toast.error("Failed to fetch coupon usage data");
      router.push("/coupons");
    } finally {
      setLoading(false);
    }
  }, [couponId, router]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const calculateUsagePercentage = (used: number, limit: number): number => {
    if (limit === 0) return 0; // Unlimited usage
    return Math.min((used / limit) * 100, 100);
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading usage statistics...</p>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Usage data not found
          </h3>
          <p className="text-gray-600 mb-6">
            Unable to load usage statistics for this coupon.
          </p>
          <Button onClick={() => router.push("/coupons")}>
            Back to Coupons
          </Button>
        </div>
      </div>
    );
  }

  const { coupon, usage_stats, recent_usage } = usageData;
  const usagePercentage = calculateUsagePercentage(
    usage_stats.total_uses,
    usage_stats.usage_limit
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/coupons")}
                variant="ghost"
                size="sm"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Coupons
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {coupon.code}
                </h1>
                <p className="text-gray-600 mt-1">
                  Usage Statistics & Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push(`/coupons/${couponId}`)}
                variant="outline"
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Coupon Details
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coupon Overview */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle>{coupon.name}</CardTitle>
            <CardDescription>Coupon Code: {coupon.code}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {usage_stats.total_uses}
                </div>
                <div className="text-sm text-gray-600">Total Uses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {usage_stats.usage_limit === 0
                    ? "∞"
                    : usage_stats.remaining_uses}
                </div>
                <div className="text-sm text-gray-600">Remaining Uses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatCurrency(usage_stats.total_discount_given)}
                </div>
                <div className="text-sm text-gray-600">Total Savings Given</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {usage_stats.usage_limit === 0
                    ? "0"
                    : Math.round(usagePercentage)}
                  %
                </div>
                <div className="text-sm text-gray-600">Usage Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Uses
              </CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{usage_stats.total_uses}</div>
              <p className="text-xs opacity-80 mt-1">
                {usage_stats.usage_limit === 0
                  ? "Unlimited usage"
                  : `of ${usage_stats.usage_limit} limit`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Savings
              </CardTitle>
              <DollarSign className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(usage_stats.total_discount_given)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                Avg:{" "}
                {formatCurrency(
                  usage_stats.total_uses > 0
                    ? usage_stats.total_discount_given / usage_stats.total_uses
                    : 0
                )}{" "}
                per use
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                First Used
              </CardTitle>
              <Calendar className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {new Date(usage_stats.first_used).toLocaleDateString()}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {new Date(usage_stats.first_used).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Last Used
              </CardTitle>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {new Date(usage_stats.last_used).toLocaleDateString()}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {Math.floor(
                  (Date.now() - new Date(usage_stats.last_used).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days ago
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Progress Bar */}
        {usage_stats.usage_limit > 0 && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Usage Progress</CardTitle>
              <CardDescription>
                {usage_stats.total_uses} of {usage_stats.usage_limit} uses (
                {Math.round(usagePercentage)}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>0</span>
                <span>{usage_stats.usage_limit}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Usage */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Usage</CardTitle>
            <CardDescription>
              Latest {recent_usage.length} coupon redemptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent_usage.map((usage) => (
                <div
                  key={usage.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {usage.order_id}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        User ID: {usage.user_id}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(usage.used_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(usage.discount_amount)}
                    </div>
                    <div className="text-xs text-gray-500">saved</div>
                  </div>
                </div>
              ))}

              {recent_usage.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No usage data
                  </h3>
                  <p className="text-gray-600">
                    This coupon hasn&apos;t been used yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
