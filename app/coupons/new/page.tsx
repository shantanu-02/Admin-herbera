"use client";

import { useState } from "react";
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
import {
  ArrowLeft,
  Save,
  Gift,
  Percent,
  DollarSign,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewCouponPage() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed_amount" | "free_shipping",
    value: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });
  const router = useRouter();

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const formatValue = (type: string, value: string) => {
    if (!value) return "";
    switch (type) {
      case "percentage":
        return `${value}%`;
      case "fixed_amount":
        return `₹${value}`;
      case "free_shipping":
        return "Free Shipping";
      default:
        return value;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.code ||
      !formData.name ||
      !formData.type ||
      !formData.value ||
      !formData.valid_from ||
      !formData.valid_until
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
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
        }),
      });

      if (response.ok) {
        toast.success("Coupon created successfully!");
        router.push("/coupons");
      } else {
        const error = await response.json();
        toast.error(error.error?.message || "Failed to create coupon");
      }
    } catch (error) {
      toast.error("Failed to create coupon");
    } finally {
      setSubmitting(false);
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
                  Create New Coupon
                </h1>
                <p className="text-gray-600 mt-1">Add a new discount coupon</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coupon Information</CardTitle>
                  <CardDescription>
                    Basic details about your coupon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Coupon Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) =>
                          handleInputChange(
                            "code",
                            e.target.value.toUpperCase()
                          )
                        }
                        placeholder="WELCOME20"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="name">Coupon Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Welcome Discount"
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
                        onValueChange={(value) =>
                          handleInputChange("type", value)
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">
                            <div className="flex items-center">
                              <Percent className="w-4 h-4 mr-2" />
                              Percentage
                            </div>
                          </SelectItem>
                          <SelectItem value="fixed_amount">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Fixed Amount
                            </div>
                          </SelectItem>
                          <SelectItem value="free_shipping">
                            <div className="flex items-center">
                              <Truck className="w-4 h-4 mr-2" />
                              Free Shipping
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="value">Discount Value *</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.value}
                        onChange={(e) =>
                          handleInputChange("value", e.target.value)
                        }
                        placeholder={
                          formData.type === "percentage" ? "20" : "100"
                        }
                        required
                        disabled={formData.type === "free_shipping"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_order_amount">
                        Minimum Order Amount
                      </Label>
                      <Input
                        id="min_order_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.min_order_amount}
                        onChange={(e) =>
                          handleInputChange("min_order_amount", e.target.value)
                        }
                        placeholder="500"
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
                        min="0"
                        value={formData.max_discount_amount}
                        onChange={(e) =>
                          handleInputChange(
                            "max_discount_amount",
                            e.target.value
                          )
                        }
                        placeholder="200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="usage_limit">Usage Limit</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        handleInputChange("usage_limit", e.target.value)
                      }
                      placeholder="100 (leave empty for unlimited)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty for unlimited usage
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Validity Period */}
              <Card>
                <CardHeader>
                  <CardTitle>Validity Period</CardTitle>
                  <CardDescription>
                    Set when this coupon is valid
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valid_from">Valid From *</Label>
                      <Input
                        id="valid_from"
                        type="datetime-local"
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
                        type="datetime-local"
                        value={formData.valid_until}
                        onChange={(e) =>
                          handleInputChange("valid_until", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Code:
                      </span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {formData.code || "COUPON_CODE"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Name:
                      </span>
                      <p className="text-sm">
                        {formData.name || "Coupon name"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Type:
                      </span>
                      <div className="flex items-center text-sm">
                        {getTypeIcon(formData.type)}
                        <span className="ml-2 capitalize">
                          {formData.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Value:
                      </span>
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatValue(formData.type, formData.value) || "0%"}
                      </p>
                    </div>
                    {formData.min_order_amount && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Min Order:
                        </span>
                        <p className="text-sm">₹{formData.min_order_amount}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        handleInputChange("is_active", e.target.checked)
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <Label htmlFor="is_active">
                      Active (available for use)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? "Creating..." : "Create Coupon"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/coupons")}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
