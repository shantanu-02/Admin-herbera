import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getCoupons, createRecord } from "@/lib/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const type = searchParams.get("type") || undefined;
    const active = searchParams.get("active") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getCoupons({
      q,
      type,
      active,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit,
        offset,
        has_more: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Coupons GET error:", error);
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

async function handlePOST(request: NextRequest) {
  try {
    const data = await request.json();
    const user = (request as any).user;

    // Validate required fields
    if (!data.code || !data.name || !data.type || data.value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Code, name, type, and value are required",
          },
        },
        { status: 400 }
      );
    }

    // Validate dates
    if (!data.valid_from || !data.valid_until) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Valid from and valid until dates are required",
          },
        },
        { status: 400 }
      );
    }

    const couponData = {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description || null,
      type: data.type,
      value: parseFloat(data.value),
      min_order_amount: data.min_order_amount
        ? parseFloat(data.min_order_amount)
        : null,
      max_discount_amount: data.max_discount_amount
        ? parseFloat(data.max_discount_amount)
        : null,
      usage_limit: data.usage_limit ? parseInt(data.usage_limit) : null,
      used_count: 0,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      is_active: data.is_active !== false,
      created_by: user.id,
      updated_by: user.id,
    };

    const newCoupon = await createRecord("coupons", couponData);

    return NextResponse.json({
      success: true,
      data: newCoupon,
    });
  } catch (error) {
    console.error("Coupons POST error:", error);

    if (error.message?.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A coupon with this code already exists",
          },
        },
        { status: 409 }
      );
    }

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

export const GET = createAuthenticatedHandler(handleGET);
export const POST = createAuthenticatedHandler(handlePOST);
