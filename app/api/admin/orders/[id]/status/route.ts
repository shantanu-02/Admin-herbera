import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getOrderById, createRecord, updateRecord } from "@/lib/database";
import { sendOrderShipmentEmail, sendOrderDeliveryEmail } from "@/lib/email";

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

    // Check if status is changing to "shipped" (and wasn't already shipped)
    const isBeingShipped = status === "shipped" && order.status !== "shipped";

    // Check if status is changing to "delivered" (and wasn't already delivered)
    const isBeingDelivered = status === "delivered" && order.status !== "delivered";

    // Update order status
    const updatedOrder = await updateRecord("orders", id, {
      status,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      // Also set is_shipped if status is shipped
      ...(status === "shipped" && { is_shipped: true }),
      // Also set is_delivered if status is delivered
      ...(status === "delivered" && { is_delivered: true }),
    });

    // Create status history entry
    const newStatusEntry = await createRecord("order_status_history", {
      order_id: id,
      status,
      notes: notes || `Order status updated to ${status}`,
      changed_at: new Date().toISOString(),
    });

    // Send shipment email if status is being changed to "shipped"
    if (isBeingShipped && order.profiles?.email) {
      try {
        const emailResult = await sendOrderShipmentEmail({
          customerName:
            order.profiles?.full_name ||
            order.profiles?.email ||
            "Customer",
          customerEmail: order.profiles.email,
          orderNumber: order.order_number,
          trackingId: updatedOrder.tracking_id || order.tracking_id || undefined,
          courierName: updatedOrder.courier_name || order.courier_name || undefined,
          trackingUrl: updatedOrder.tracking_url || order.tracking_url || undefined,
          shippingAddress: order.shipping_address
            ? {
                full_name: order.shipping_address.full_name,
                address_line1: order.shipping_address.address_line1,
                address_line2: order.shipping_address.address_line2,
                city: order.shipping_address.city,
                state: order.shipping_address.state,
                postal_code: order.shipping_address.postal_code,
                country: order.shipping_address.country,
              }
            : undefined,
          orderItems: order.order_items
            ? order.order_items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              }))
            : undefined,
          totalAmount: order.total_amount
            ? parseFloat(order.total_amount.toString())
            : undefined,
        });

        if (!emailResult.success) {
          console.error(
            "Failed to send shipment email:",
            emailResult.error
          );
          // Don't fail the request if email fails, just log it
        }
      } catch (emailError) {
        console.error("Error sending shipment email:", emailError);
        // Don't fail the request if email fails, just log it
      }
    }

    // Send delivery email if status is being changed to "delivered"
    if (isBeingDelivered && order.profiles?.email) {
      try {
        const emailResult = await sendOrderDeliveryEmail({
          customerName:
            order.profiles?.full_name ||
            order.profiles?.email ||
            "Customer",
          customerEmail: order.profiles.email,
          orderNumber: order.order_number,
          trackingId: updatedOrder.tracking_id || order.tracking_id || undefined,
          courierName: updatedOrder.courier_name || order.courier_name || undefined,
          trackingUrl: updatedOrder.tracking_url || order.tracking_url || undefined,
          shippingAddress: order.shipping_address
            ? {
                full_name: order.shipping_address.full_name,
                address_line1: order.shipping_address.address_line1,
                address_line2: order.shipping_address.address_line2,
                city: order.shipping_address.city,
                state: order.shipping_address.state,
                postal_code: order.shipping_address.postal_code,
                country: order.shipping_address.country,
              }
            : undefined,
          orderItems: order.order_items
            ? order.order_items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              }))
            : undefined,
          totalAmount: order.total_amount
            ? parseFloat(order.total_amount.toString())
            : undefined,
        });

        if (!emailResult.success) {
          console.error(
            "Failed to send delivery email:",
            emailResult.error
          );
          // Don't fail the request if email fails, just log it
        }
      } catch (emailError) {
        console.error("Error sending delivery email:", emailError);
        // Don't fail the request if email fails, just log it
      }
    }

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
