import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getCouponUsage } from "@/lib/database";

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const usage = await getCouponUsage(id);

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error("Coupon usage error:", error);
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

export const GET = createAuthenticatedHandler(handler);
