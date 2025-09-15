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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  User,
  MapPin,
  CreditCard,
  Edit,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

interface OrderItem {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string;
  changed_at: string;
}

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
  courier_name: string;
  tracking_id: string;
  tracking_url: string;
  placed_at: string;
  updated_at: string;
  shipping_address: Address;
  billing_address: Address;
  customer: {
    id: string;
    email: string;
  };
  items: OrderItem[];
  status_history: StatusHistory[];
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    payment_status: "",
    courier_name: "",
    tracking_id: "",
    tracking_url: "",
    notes: "",
  });
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      setEditData({
        status: order.status,
        payment_status: order.payment_status,
        courier_name: order.courier_name || "",
        tracking_id: order.tracking_id || "",
        tracking_url: order.tracking_url || "",
        notes: "",
      });
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
      } else {
        toast.error("Failed to fetch order details");
        router.push("/orders");
      }
    } catch (error) {
      toast.error("Failed to fetch order details");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!order) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        toast.success("Order updated successfully");
        setIsEditing(false);
        fetchOrder();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to update order");
      }
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const addStatusUpdate = async () => {
    if (!editData.status || !editData.notes.trim()) {
      toast.error("Status and notes are required");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editData.status,
          notes: editData.notes,
        }),
      });

      if (response.ok) {
        toast.success("Status update added successfully");
        setEditData((prev) => ({ ...prev, notes: "" }));
        fetchOrder();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to add status update");
      }
    } catch (error) {
      toast.error("Failed to add status update");
    }
  };

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
        icon: CheckCircle,
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
      pending: { variant: "secondary" as const },
      paid: { variant: "default" as const },
      failed: { variant: "destructive" as const },
      refunded: { variant: "outline" as const },
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
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Order not found
          </h3>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
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
                onClick={() => router.push("/orders")}
                variant="ghost"
                size="sm"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {order.order_number}
                </h1>
                <p className="text-gray-600 mt-1">Order Details & Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.payment_status)}
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Order Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Customer Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {order.customer.email}
                      </div>
                      <div>
                        <span className="font-medium">Order Date:</span>{" "}
                        {new Date(order.placed_at).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Payment Method:</span>{" "}
                        {order.payment_method}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Order Status
                    </h4>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="status" className="text-xs">
                            Order Status
                          </Label>
                          <Select
                            value={editData.status}
                            onValueChange={(value) =>
                              setEditData((prev) => ({
                                ...prev,
                                status: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="payment_status" className="text-xs">
                            Payment Status
                          </Label>
                          <Select
                            value={editData.payment_status}
                            onValueChange={(value) =>
                              setEditData((prev) => ({
                                ...prev,
                                payment_status: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Status:</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Payment:</span>
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Shipping Address
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="font-medium">
                        {order.shipping_address.recipient_name}
                      </div>
                      <div>{order.shipping_address.phone}</div>
                      <div>{order.shipping_address.line1}</div>
                      {order.shipping_address.line2 && (
                        <div>{order.shipping_address.line2}</div>
                      )}
                      <div>
                        {order.shipping_address.city},{" "}
                        {order.shipping_address.state}{" "}
                        {order.shipping_address.postal_code}
                      </div>
                      <div>{order.shipping_address.country}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Tracking Information
                    </h4>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="courier" className="text-xs">
                            Courier Service
                          </Label>
                          <Input
                            id="courier"
                            value={editData.courier_name}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                courier_name: e.target.value,
                              }))
                            }
                            placeholder="e.g., BlueDart, FedEx"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tracking" className="text-xs">
                            Tracking ID
                          </Label>
                          <Input
                            id="tracking"
                            value={editData.tracking_id}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                tracking_id: e.target.value,
                              }))
                            }
                            placeholder="e.g., BD123456789"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tracking_url" className="text-xs">
                            Tracking URL
                          </Label>
                          <Input
                            id="tracking_url"
                            value={editData.tracking_url}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                tracking_url: e.target.value,
                              }))
                            }
                            placeholder="https://tracking.example.com/..."
                            className="h-9"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Courier:</span>{" "}
                          {order.courier_name || "Not assigned"}
                        </div>
                        <div>
                          <span className="font-medium">Tracking ID:</span>{" "}
                          {order.tracking_id || "Not available"}
                        </div>
                        {order.tracking_url && (
                          <div>
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 underline"
                            >
                              Track Package
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <Button
                      onClick={handleUpdateOrder}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Update Order Information
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{item.total}</div>
                        <div className="text-sm text-gray-600">
                          ₹{item.price} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Status History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>₹{order.shipping_charges}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-₹{order.discount}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total:</span>
                      <span>₹{order.total_amount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
                <CardDescription>
                  Track all status changes for this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Status Update Form */}
                  {isEditing && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium">
                          Add Status Note
                        </Label>
                        <Textarea
                          id="notes"
                          value={editData.notes}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Add a note about this status change..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <Button
                        onClick={addStatusUpdate}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Add Status Update
                      </Button>
                    </div>
                  )}

                  {/* Status History */}
                  <div className="space-y-4">
                    {order.status_history.map((status, index) => (
                      <div key={status.id} className="relative">
                        {index < order.status_history.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-px bg-gray-200"></div>
                        )}
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(status.status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {status.notes}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(status.changed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
