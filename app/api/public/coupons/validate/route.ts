import { NextRequest, NextResponse } from "next/server";

// Mock coupons data (same as in coupons/route.ts)
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
    usage_limit: 0,
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

function calculateDiscount(coupon: any, orderAmount: number): number {
  if (coupon.type === "percentage") {
    const discountAmount = (orderAmount * coupon.value) / 100;
    return coupon.max_discount_amount > 0
      ? Math.min(discountAmount, coupon.max_discount_amount)
      : discountAmount;
  } else if (coupon.type === "fixed_amount") {
    return coupon.value;
  } else if (coupon.type === "free_shipping") {
    // For free shipping, we'll assume a standard shipping cost
    return 100; // ₹100 shipping cost saved
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const { code, order_amount } = await request.json();

    // Validate input
    if (!code || !order_amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Coupon code and order amount are required",
          },
        },
        { status: 400 }
      );
    }

    if (typeof order_amount !== "number" || order_amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Order amount must be a positive number",
          },
        },
        { status: 400 }
      );
    }

    // Find the coupon
    const coupon = coupons.find(
      (c) => c.code.toLowerCase() === code.toLowerCase()
    );

    if (!coupon) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          discount_amount: 0,
          final_amount: order_amount,
          message: "Invalid coupon code",
        },
      });
    }

    // Check if coupon is valid (active, within date range, usage limit)
    if (!isValidCoupon(coupon)) {
      let message = "Coupon is not valid";

      if (!coupon.is_active) {
        message = "This coupon is no longer active";
      } else {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = new Date(coupon.valid_until);

        if (now < validFrom) {
          message = "This coupon is not yet valid";
        } else if (now > validUntil) {
          message = "This coupon has expired";
        } else if (
          coupon.usage_limit > 0 &&
          coupon.used_count >= coupon.usage_limit
        ) {
          message = "This coupon has reached its usage limit";
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          discount_amount: 0,
          final_amount: order_amount,
          message,
        },
      });
    }

    // Check minimum order amount
    if (order_amount < coupon.min_order_amount) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          discount_amount: 0,
          final_amount: order_amount,
          message: `Minimum order amount of ₹${coupon.min_order_amount} required`,
        },
      });
    }

    // Calculate discount
    const discountAmount = calculateDiscount(coupon, order_amount);
    const finalAmount = Math.max(0, order_amount - discountAmount);

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
        },
      },
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
