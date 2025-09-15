import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getDashboardStats } from "@/lib/database";

async function handler(request: NextRequest) {
  try {
    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: stats.total_products,
        totalOrders: stats.total_orders,
        totalCustomers: stats.total_customers,
        totalRevenue: stats.total_revenue,
        pendingReviews: stats.pending_reviews,
        activeCoupons: stats.active_coupons,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
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
