import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getOrderById, createRecord, updateRecord } from "@/lib/database";

async function handlePOST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status, notes } = await request.json();
    const user = (request as any).user;

    // Validate input
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Status is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = [
      "pending",
      "paid",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message:
              "Invalid status. Valid statuses are: " + validStatuses.join(", "),
          },
        },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Order not found",
          },
        },
        { status: 404 }
      );
    }

    // Update order status
    await updateRecord("orders", id, {
      status,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });

    // Create status history entry
    const newStatusEntry = await createRecord("order_status_history", {
      order_id: id,
      status,
      notes: notes || `Order status updated to ${status}`,
      changed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newStatusEntry,
    });
  } catch (error) {
    console.error("Order status update error:", error);
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

export const POST = createAuthenticatedHandler(handlePOST);
