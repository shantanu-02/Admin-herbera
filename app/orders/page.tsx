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
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_charges: number;
  discount: number;
  total_amount: number;
  placed_at: string;
  updated_at: string;
  items_count: number;
  courier_name?: string;
  tracking_id?: string;
  tracking_url?: string;
  is_shipped?: boolean;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  profiles?: {
    email: string;
    full_name: string;
  };
  shipping_address?: {
    recipient_name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address?: {
    recipient_name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [shippedFilter, setShippedFilter] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for URL parameters and set initial filters
    const statusParam = searchParams.get("status");
    const paymentStatusParam = searchParams.get("payment_status");
    const shippedParam = searchParams.get("is_shipped");

    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (paymentStatusParam) {
      setPaymentStatusFilter(paymentStatusParam);
    }
    if (shippedParam) {
      setShippedFilter(shippedParam);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const url = new URL("/api/admin/orders", window.location.origin);
      if (statusFilter && statusFilter !== "all")
        url.searchParams.append("status", statusFilter);
      if (paymentStatusFilter && paymentStatusFilter !== "all")
        url.searchParams.append("payment_status", paymentStatusFilter);
      if (shippedFilter && shippedFilter !== "all")
        url.searchParams.append("is_shipped", shippedFilter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredOrders = data.data;

        // Apply client-side search filter
        if (searchQuery) {
          const searchTerm = searchQuery.toLowerCase();
          filteredOrders = filteredOrders.filter(
            (order: Order) =>
              order.order_number.toLowerCase().includes(searchTerm) ||
              order.profiles?.email?.toLowerCase().includes(searchTerm) ||
              order.shipping_address?.recipient_name
                ?.toLowerCase()
                .includes(searchTerm)
          );
        }

        setOrders(filteredOrders);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentStatusFilter, shippedFilter, searchQuery, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: "secondary" as const,
        icon: Clock,
        color: "text-yellow-600",
      },
      paid: {
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-blue-600",
      },
      shipped: {
        variant: "default" as const,
        icon: Truck,
        color: "text-purple-600",
      },
      delivered: {
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      },
      cancelled: {
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, color: "text-yellow-600" },
      paid: { variant: "default" as const, color: "text-green-600" },
      failed: { variant: "destructive" as const, color: "text-red-600" },
      refunded: { variant: "outline" as const, color: "text-gray-600" },
    };

    const config =
      statusConfig[paymentStatus as keyof typeof statusConfig] ||
      statusConfig.pending;

    return (
      <Badge variant={config.variant} className="capitalize">
        {paymentStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-600 mt-1">
                  Manage customer orders and fulfillment
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
              placeholder="Search orders..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={shippedFilter} onValueChange={setShippedFilter}>
            <SelectTrigger className="w-full lg:w-32 h-12">
              <SelectValue placeholder="Shipping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="true">Shipped</SelectItem>
              <SelectItem value="false">Not Shipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {order.order_number}
                      </CardTitle>
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{order.profiles?.email || "No email"}</span>
                      <span>•</span>
                      <span>{order.items_count} items</span>
                      <span>•</span>
                      <span>
                        Placed: {new Date(order.placed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-emerald-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer & Shipping Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Shipping Address
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="font-medium">
                        {order.shipping_address?.recipient_name || "No address"}
                      </div>
                      <div>
                        {order.shipping_address?.city},{" "}
                        {order.shipping_address?.state}
                      </div>
                      <div>{order.shipping_address?.postal_code}</div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Order Summary
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping:</span>
                        <span>₹{order.shipping_charges}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-₹{order.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-gray-900 pt-1 border-t">
                        <span>Total:</span>
                        <span>₹{order.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payment</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Method: {order.payment_method || "N/A"}</div>
                      <div>
                        Status: {getPaymentStatusBadge(order.payment_status)}
                      </div>
                      {order.razorpay_payment_id && (
                        <div className="text-xs text-gray-500">
                          Payment ID: {order.razorpay_payment_id}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Last updated:{" "}
                        {new Date(order.updated_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter || paymentStatusFilter
                  ? "No orders match your current filters."
                  : "Orders will appear here when customers start placing orders."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
