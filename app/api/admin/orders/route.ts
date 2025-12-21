import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getOrders } from "@/lib/database";

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;
    const payment_status = searchParams.get("payment_status") || undefined;
    const is_shipped = searchParams.get("is_shipped") || undefined;
    const is_delivered = searchParams.get("is_delivered") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getOrders({
      q,
      status,
      payment_status,
      is_shipped,
      is_delivered,
      limit,
      offset,
    });

    // Format the response to match expected structure
    const formattedOrders = result.data.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      subtotal: order.subtotal,
      shipping_charges: order.shipping_charges,
      discount: order.discount,
      total_amount: order.total_amount,
      courier_name: order.courier_name,
      tracking_id: order.tracking_id,
      tracking_url: order.tracking_url,
      is_shipped: order.is_shipped,
      is_delivered: order.is_delivered,
      placed_at: order.placed_at,
      updated_at: order.updated_at,
      customer: {
        id: order.user_id,
        email: order.profiles?.email || "",
        full_name: order.profiles?.full_name || "",
      },
      shipping_address: order.shipping_address || null,
      billing_address: order.billing_address || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedOrders,
      pagination: {
        total: result.total,
        limit,
        offset,
        has_more: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Orders error:", error);
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
