import { NextRequest, NextResponse } from "next/server";

// Mock coupons data - only active and valid coupons for public API
const coupons = [
  {
    id: "1",
    code: "WELCOME20",
    name: "Welcome Discount",
    description: "20% off on your first order above ₹500",
    type: "percentage",
    value: 20.0,
    min_order_amount: 500.0,
    max_discount_amount: 200.0,
    usage_limit: 1000,
    used_count: 45,
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "2",
    code: "SAVE100",
    name: "Flat ₹100 Off",
    description: "Get ₹100 off on orders above ₹1000",
    type: "fixed_amount",
    value: 100.0,
    min_order_amount: 1000.0,
    max_discount_amount: 100.0,
    usage_limit: 500,
    used_count: 23,
    valid_from: "2024-01-15T00:00:00Z",
    valid_until: "2024-06-30T23:59:59Z",
    is_active: true,
  },
  {
    id: "3",
    code: "FREESHIP",
    name: "Free Shipping",
    description: "Free shipping on all orders above ₹300",
    type: "free_shipping",
    value: 0.0,
    min_order_amount: 300.0,
    max_discount_amount: 0.0,
    usage_limit: 0, // unlimited
    used_count: 156,
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "4",
    code: "SKINCARE15",
    name: "Skincare Special",
    description: "15% off on all skincare products",
    type: "percentage",
    value: 15.0,
    min_order_amount: 800.0,
    max_discount_amount: 150.0,
    usage_limit: 200,
    used_count: 67,
    valid_from: "2024-02-01T00:00:00Z",
    valid_until: "2024-03-31T23:59:59Z",
    is_active: true,
  },
];

function isValidCoupon(coupon: any): boolean {
  const now = new Date();
  const validFrom = new Date(coupon.valid_from);
  const validUntil = new Date(coupon.valid_until);

  return (
    coupon.is_active &&
    now >= validFrom &&
    now <= validUntil &&
    (coupon.usage_limit === 0 || coupon.used_count < coupon.usage_limit)
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Filter only active and currently valid coupons
    let validCoupons = coupons.filter(isValidCoupon);

    // Apply type filter if specified
    if (type) {
      validCoupons = validCoupons.filter((coupon) => coupon.type === type);
    }

    // Format for public API response - hide internal fields
    const formattedCoupons = validCoupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCoupons,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
