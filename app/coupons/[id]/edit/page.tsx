"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
  value: number;
  min_order_amount: number;
  max_discount_amount: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  const fetchCoupon = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const couponData = data.data;

        setCoupon(couponData);
        setFormData({
          code: couponData.code || "",
          name: couponData.name || "",
          description: couponData.description || "",
          type: couponData.type || "percentage",
          value: couponData.value?.toString() || "",
          min_order_amount: couponData.min_order_amount?.toString() || "",
          max_discount_amount: couponData.max_discount_amount?.toString() || "",
          usage_limit: couponData.usage_limit?.toString() || "",
          valid_from: couponData.valid_from
            ? new Date(couponData.valid_from).toISOString().split("T")[0]
            : "",
          valid_until: couponData.valid_until
            ? new Date(couponData.valid_until).toISOString().split("T")[0]
            : "",
          is_active: couponData.is_active ?? true,
        });
      } else {
        toast.error("Failed to fetch coupon");
        router.push("/coupons");
      }
    } catch (error) {
      console.error("Error fetching coupon:", error);
      toast.error("Failed to fetch coupon");
    } finally {
      setLoading(false);
    }
  }, [couponId, router]);

  useEffect(() => {
    fetchCoupon();
  }, [fetchCoupon]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.code ||
      !formData.name ||
      !formData.value ||
      !formData.valid_from ||
      !formData.valid_until
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          min_order_amount: formData.min_order_amount
            ? parseFloat(formData.min_order_amount)
            : null,
          max_discount_amount: formData.max_discount_amount
            ? parseFloat(formData.max_discount_amount)
            : null,
          usage_limit: formData.usage_limit
            ? parseInt(formData.usage_limit)
            : null,
          valid_from: new Date(formData.valid_from).toISOString(),
          valid_until: new Date(formData.valid_until).toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Coupon updated successfully!");
        router.push("/coupons");
      } else {
        const error = await response.json();
        toast.error(error.error?.message || "Failed to update coupon");
      }
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast.error("Failed to update coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading coupon...</div>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Coupon not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/coupons")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Coupons
        </Button>
        <h1 className="text-2xl font-bold">Edit Coupon</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Coupon Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    handleInputChange("code", e.target.value.toUpperCase())
                  }
                  placeholder="Enter coupon code"
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Coupon Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter coupon name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter coupon description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Discount Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Discount Value *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_order_amount">Minimum Order Amount</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  value={formData.min_order_amount}
                  onChange={(e) =>
                    handleInputChange("min_order_amount", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="max_discount_amount">
                  Maximum Discount Amount
                </Label>
                <Input
                  id="max_discount_amount"
                  type="number"
                  step="0.01"
                  value={formData.max_discount_amount}
                  onChange={(e) =>
                    handleInputChange("max_discount_amount", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="usage_limit">Usage Limit</Label>
              <Input
                id="usage_limit"
                type="number"
                value={formData.usage_limit}
                onChange={(e) =>
                  handleInputChange("usage_limit", e.target.value)
                }
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    handleInputChange("valid_from", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="valid_until">Valid Until *</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    handleInputChange("valid_until", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  handleInputChange("is_active", e.target.checked)
                }
                className="rounded"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/coupons")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  "Updating..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Coupon
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
