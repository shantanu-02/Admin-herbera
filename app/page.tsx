"use client";

import { useEffect, useState } from "react";
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
import {
  ShoppingBag,
  Users,
  Package,
  Star,
  Gift,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingReviews: number;
  activeCoupons: number;
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      // Check if token is expired
      try {
        const base64Url = token.split(".")[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const decoded = JSON.parse(jsonPayload);
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (decoded.exp && decoded.exp < currentTime) {
            // Token expired
            localStorage.removeItem("admin_token");
            setIsAuthenticated(false);
            toast.error("Session expired. Please login again.");
            return;
          }
        }
      } catch (error) {
        // If we can't decode the token, treat it as invalid
        localStorage.removeItem("admin_token");
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(true);
      fetchDashboardStats();
    }
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("admin_token", data.data.token);
        setIsAuthenticated(true);
        toast.success("Welcome to Herbera Admin!");
        fetchDashboardStats();
      } else {
        toast.error(data.error?.message || "Login failed");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setStats(null);
    toast.success("Logged out successfully");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Herbera Co.
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Admin Dashboard Login
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@herbera.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingBag className="w-8 h-8 text-emerald-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Herbera Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/categories")}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Categories
              </Button>
              <Button
                onClick={() => router.push("/products")}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Products
              </Button>
              <Button
                onClick={() => router.push("/orders")}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Orders
              </Button>
              <Button
                onClick={() => router.push("/coupons")}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Coupons
              </Button>
              <Button
                onClick={() => router.push("/reviews")}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Reviews
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Overview
          </h2>
          <p className="text-gray-600">
            Welcome back! Here&apos;s what&apos;s happening with your business
            today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Products
              </CardTitle>
              <Package className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalProducts || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">
                Active products in catalog
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Orders
              </CardTitle>
              <ShoppingBag className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">Orders processed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Customers
              </CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalCustomers || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">Registered customers</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{stats?.totalRevenue || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">Total revenue generated</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-pink-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Pending Reviews
              </CardTitle>
              <Star className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.pendingReviews || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">
                Reviews awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Active Coupons
              </CardTitle>
              <Gift className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.activeCoupons || 0}
              </div>
              <p className="text-xs opacity-80 mt-1">Active discount coupons</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Button
                onClick={() => router.push("/products/new")}
                className="h-12 bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Add New Product
              </Button>
              <Button
                onClick={() => router.push("/categories/new")}
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create Category
              </Button>
              <Button
                onClick={() => router.push("/coupons/new")}
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create Coupon
              </Button>
              <Button
                onClick={() => router.push("/blogs/new")}
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
              >
                New Blog Post
              </Button>
              <Button
                onClick={() => router.push("/partners/new")}
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
              >
                New Partner
              </Button>
              <Button
                onClick={() => router.push("/orders?status=pending")}
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
              >
                View Pending Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
