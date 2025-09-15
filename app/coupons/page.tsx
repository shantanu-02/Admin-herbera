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
  Gift,
  Percent,
  DollarSign,
  Truck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  min_order_amount: number;
  max_discount_amount: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed_amount" | "free_shipping",
    value: 0,
    min_order_amount: 0,
    max_discount_amount: 0,
    usage_limit: 100,
    valid_from: "",
    valid_until: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchCoupons = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const url = new URL("/api/admin/coupons", window.location.origin);
      if (typeFilter && typeFilter !== "all")
        url.searchParams.append("type", typeFilter);
      if (activeFilter && activeFilter !== "all")
        url.searchParams.append("is_active", activeFilter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filteredCoupons = data.data;

        // Apply client-side search filter
        if (searchQuery) {
          const searchTerm = searchQuery.toLowerCase();
          filteredCoupons = filteredCoupons.filter(
            (coupon: Coupon) =>
              coupon.code.toLowerCase().includes(searchTerm) ||
              coupon.name.toLowerCase().includes(searchTerm)
          );
        }

        setCoupons(filteredCoupons);
      } else {
        toast.error("Failed to fetch coupons");
      }
    } catch (error) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, activeFilter, searchQuery, router]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Coupon created successfully");
        setShowCreateDialog(false);
        resetForm();
        fetchCoupons();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to create coupon");
      }
    } catch (error) {
      toast.error("Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Coupon updated successfully");
        setShowEditDialog(false);
        setEditingCoupon(null);
        resetForm();
        fetchCoupons();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to update coupon");
      }
    } catch (error) {
      toast.error("Failed to update coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      usage_limit: coupon.usage_limit,
      valid_from: coupon.valid_from.substring(0, 16), // Format for datetime-local
      valid_until: coupon.valid_until.substring(0, 16),
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      min_order_amount: 0,
      max_discount_amount: 0,
      usage_limit: 100,
      valid_from: "",
      valid_until: "",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="w-4 h-4" />;
      case "fixed_amount":
        return <DollarSign className="w-4 h-4" />;
      case "free_shipping":
        return <Truck className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const formatValue = (type: string, value: number) => {
    switch (type) {
      case "percentage":
        return `${value}%`;
      case "fixed_amount":
        return `₹${value}`;
      case "free_shipping":
        return "Free Shipping";
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coupons...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
                <p className="text-gray-600 mt-1">
                  Manage discount coupons and promotions
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
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
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full lg:w-48 h-12">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              <SelectItem value="free_shipping">Free Shipping</SelectItem>
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
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeIcon(coupon.type)}
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {coupon.code}
                      </CardTitle>
                      <Badge
                        variant={coupon.is_active ? "default" : "secondary"}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">
                      {coupon.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {coupon.description}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      onClick={() => openEditDialog(coupon)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-600 hover:text-emerald-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(coupon.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="font-semibold text-emerald-600">
                      {formatValue(coupon.type, coupon.value)}
                    </span>
                  </div>

                  {coupon.min_order_amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Min Order:</span>
                      <span className="text-sm font-medium">
                        ₹{coupon.min_order_amount}
                      </span>
                    </div>
                  )}

                  {coupon.max_discount_amount > 0 &&
                    coupon.type === "percentage" && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Max Discount:
                        </span>
                        <span className="text-sm font-medium">
                          ₹{coupon.max_discount_amount}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Usage:</span>
                    <span className="text-sm font-medium">
                      {coupon.used_count} /{" "}
                      {coupon.usage_limit === 0 ? "∞" : coupon.usage_limit}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      <div>
                        Valid:{" "}
                        {new Date(coupon.valid_from).toLocaleDateString()}
                      </div>
                      <div>
                        Until:{" "}
                        {new Date(coupon.valid_until).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No coupons found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || typeFilter || activeFilter
                  ? "No coupons match your current filters."
                  : "Get started by creating your first coupon."}
              </p>
              {!searchQuery && !typeFilter && !activeFilter && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coupon
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Create a discount coupon for customer promotions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., WELCOME20"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Discount Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      <SelectItem value="free_shipping">
                        Free Shipping
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Coupon Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Welcome Discount"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the coupon..."
                  rows={2}
                />
              </div>

              {formData.type !== "free_shipping" && (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    {formData.type === "percentage"
                      ? "Percentage (%)"
                      : "Amount (₹)"}{" "}
                    *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    step={formData.type === "percentage" ? "0.01" : "1"}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    className="h-10"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order">Min Order Amount (₹)</Label>
                  <Input
                    id="min_order"
                    type="number"
                    min="0"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="0"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usage_limit: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-10"
                  />
                </div>
              </div>

              {formData.type === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Max Discount Amount (₹)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    min="0"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-10"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Valid From *</Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until *</Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    required
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? "Creating..." : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure to Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
              <DialogDescription>
                Update the coupon information.
              </DialogDescription>
            </DialogHeader>
            {/* Form fields similar to create dialog */}
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {/* Same form structure as create dialog */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Coupon Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-valid-from">Valid From *</Label>
                  <Input
                    id="edit-valid-from"
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-valid-until">Valid Until *</Label>
                  <Input
                    id="edit-valid-until"
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    required
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? "Updating..." : "Update Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
