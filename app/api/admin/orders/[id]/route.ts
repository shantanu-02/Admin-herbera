import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getOrderById, updateRecord } from "@/lib/database";
import { sendOrderShipmentEmail, sendOrderDeliveryEmail } from "@/lib/email";

async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Order GET error:", error);
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

async function handlePATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    const user = (request as any).user;

    // Get current order to check if it's being shipped
    const currentOrder = await getOrderById(id);
    if (!currentOrder) {
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

    // Check if order is being shipped (is_shipped changing from false to true)
    const isBeingShipped =
      updates.is_shipped === true && currentOrder.is_shipped !== true;

    // Check if order is being delivered (is_delivered changing from false to true)
    const isBeingDelivered =
      updates.is_delivered === true && currentOrder.is_delivered !== true;

    // Prepare update data
    const updateData = {
      ...updates,
      updated_by: user.id,
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.user_id;
    delete updateData.order_number;
    delete updateData.placed_at;

    const updatedOrder = await updateRecord("orders", id, updateData);

    // Send shipment email if order is being shipped
    if (isBeingShipped && currentOrder.profiles?.email) {
      try {
        const emailResult = await sendOrderShipmentEmail({
          customerName:
            currentOrder.profiles?.full_name ||
            currentOrder.profiles?.email ||
            "Customer",
          customerEmail: currentOrder.profiles.email,
          orderNumber: currentOrder.order_number,
          trackingId: updatedOrder.tracking_id || undefined,
          courierName: updatedOrder.courier_name || undefined,
          trackingUrl: updatedOrder.tracking_url || undefined,
          shippingAddress: currentOrder.shipping_address
            ? {
                full_name: currentOrder.shipping_address.full_name,
                address_line1: currentOrder.shipping_address.address_line1,
                address_line2: currentOrder.shipping_address.address_line2,
                city: currentOrder.shipping_address.city,
                state: currentOrder.shipping_address.state,
                postal_code: currentOrder.shipping_address.postal_code,
                country: currentOrder.shipping_address.country,
              }
            : undefined,
          orderItems: currentOrder.order_items
            ? currentOrder.order_items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              }))
            : undefined,
          totalAmount: currentOrder.total_amount
            ? parseFloat(currentOrder.total_amount.toString())
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

    // Send delivery email if order is being marked as delivered
    if (isBeingDelivered && currentOrder.profiles?.email) {
      try {
        const emailResult = await sendOrderDeliveryEmail({
          customerName:
            currentOrder.profiles?.full_name ||
            currentOrder.profiles?.email ||
            "Customer",
          customerEmail: currentOrder.profiles.email,
          orderNumber: currentOrder.order_number,
          trackingId: updatedOrder.tracking_id || currentOrder.tracking_id || undefined,
          courierName: updatedOrder.courier_name || currentOrder.courier_name || undefined,
          trackingUrl: updatedOrder.tracking_url || currentOrder.tracking_url || undefined,
          shippingAddress: currentOrder.shipping_address
            ? {
                full_name: currentOrder.shipping_address.full_name,
                address_line1: currentOrder.shipping_address.address_line1,
                address_line2: currentOrder.shipping_address.address_line2,
                city: currentOrder.shipping_address.city,
                state: currentOrder.shipping_address.state,
                postal_code: currentOrder.shipping_address.postal_code,
                country: currentOrder.shipping_address.country,
              }
            : undefined,
          orderItems: currentOrder.order_items
            ? currentOrder.order_items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              }))
            : undefined,
          totalAmount: currentOrder.total_amount
            ? parseFloat(currentOrder.total_amount.toString())
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
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Order PATCH error:", error);
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
export const PATCH = createAuthenticatedHandler(handlePATCH);
