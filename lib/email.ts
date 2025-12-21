import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderShipmentEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingId?: string;
  courierName?: string;
  trackingUrl?: string;
  shippingAddress?: {
    full_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  orderItems?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount?: number;
}

/**
 * Send order shipment notification email to customer
 */
export async function sendOrderShipmentEmail(
  data: OrderShipmentEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return { success: false, error: "Email service not configured" };
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error("RESEND_FROM_EMAIL is not configured");
      return { success: false, error: "From email not configured" };
    }

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your Order #${data.orderNumber} Has Been Shipped! 🚚`,
      html: generateShipmentEmailHTML(data),
    });

    if (error) {
      console.error("Resend email error:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log("Order shipment email sent successfully:", emailData?.id);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending order shipment email:", error);
    return {
      success: false,
      error: error?.message || "Failed to send email",
    };
  }
}

/**
 * Generate HTML email template for order shipment notification
 */
function generateShipmentEmailHTML(data: OrderShipmentEmailData): string {
  const trackingSection = data.trackingId
    ? `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Tracking Information</h3>
      <p style="margin: 10px 0;"><strong>Tracking ID:</strong> ${data.trackingId}</p>
      ${data.courierName ? `<p style="margin: 10px 0;"><strong>Courier:</strong> ${data.courierName}</p>` : ""}
      ${data.trackingUrl ? `<p style="margin: 10px 0;"><a href="${data.trackingUrl}" style="color: #007bff; text-decoration: none;">Track Your Package →</a></p>` : ""}
    </div>
  `
    : "";

  const orderItemsSection = data.orderItems && data.orderItems.length > 0
    ? `
    <div style="margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data.orderItems
            .map(
              (item) => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${item.price.toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      ${data.totalAmount ? `<p style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 18px;">Total: ₹${data.totalAmount.toFixed(2)}</p>` : ""}
    </div>
  `
    : "";

  const shippingAddressSection = data.shippingAddress
    ? `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 5px 0; line-height: 1.6;">
        ${data.shippingAddress.full_name || ""}<br>
        ${data.shippingAddress.address_line1 || ""}<br>
        ${data.shippingAddress.address_line2 ? `${data.shippingAddress.address_line2}<br>` : ""}
        ${data.shippingAddress.city || ""}, ${data.shippingAddress.state || ""} ${data.shippingAddress.postal_code || ""}<br>
        ${data.shippingAddress.country || ""}
      </p>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Shipped - Herbera</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">🚚 Your Order Has Been Shipped!</h1>
        </div>
        
        <p style="font-size: 16px;">Dear ${data.customerName},</p>
        
        <p style="font-size: 16px;">
          Great news! Your order <strong>#${data.orderNumber}</strong> has been shipped and is on its way to you.
        </p>

        ${trackingSection}
        ${shippingAddressSection}
        ${orderItemsSection}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dee2e6;">
          <p style="font-size: 14px; color: #666; margin: 10px 0;">
            You can track your order status anytime by visiting your account or using the tracking information above.
          </p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;">
            If you have any questions or concerns, please don't hesitate to contact our customer support team.
          </p>
        </div>

        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="font-size: 14px; color: #666; margin: 5px 0;">Thank you for shopping with Herbera!</p>
          <p style="font-size: 14px; color: #666; margin: 5px 0;">
            <a href="https://herbera.in" style="color: #007bff; text-decoration: none;">Visit Herbera</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface OrderDeliveryEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingId?: string;
  courierName?: string;
  trackingUrl?: string;
  shippingAddress?: {
    full_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  orderItems?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount?: number;
}

/**
 * Send order delivery notification email to customer
 */
export async function sendOrderDeliveryEmail(
  data: OrderDeliveryEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return { success: false, error: "Email service not configured" };
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error("RESEND_FROM_EMAIL is not configured");
      return { success: false, error: "From email not configured" };
    }

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your Order #${data.orderNumber} Has Been Delivered! 🎉`,
      html: generateDeliveryEmailHTML(data),
    });

    if (error) {
      console.error("Resend email error:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log("Order delivery email sent successfully:", emailData?.id);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending order delivery email:", error);
    return {
      success: false,
      error: error?.message || "Failed to send email",
    };
  }
}

/**
 * Generate HTML email template for order delivery notification
 */
function generateDeliveryEmailHTML(data: OrderDeliveryEmailData): string {
  const orderItemsSection = data.orderItems && data.orderItems.length > 0
    ? `
    <div style="margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data.orderItems
            .map(
              (item) => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${item.price.toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      ${data.totalAmount ? `<p style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 18px;">Total: ₹${data.totalAmount.toFixed(2)}</p>` : ""}
    </div>
  `
    : "";

  const shippingAddressSection = data.shippingAddress
    ? `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Delivery Address</h3>
      <p style="margin: 5px 0; line-height: 1.6;">
        ${data.shippingAddress.full_name || ""}<br>
        ${data.shippingAddress.address_line1 || ""}<br>
        ${data.shippingAddress.address_line2 ? `${data.shippingAddress.address_line2}<br>` : ""}
        ${data.shippingAddress.city || ""}, ${data.shippingAddress.state || ""} ${data.shippingAddress.postal_code || ""}<br>
        ${data.shippingAddress.country || ""}
      </p>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Delivered - Herbera</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">🎉 Your Order Has Been Delivered!</h1>
        </div>
        
        <p style="font-size: 16px;">Dear ${data.customerName},</p>
        
        <p style="font-size: 16px;">
          We're excited to let you know that your order <strong>#${data.orderNumber}</strong> has been successfully delivered!
        </p>

        <p style="font-size: 16px;">
          We hope you're happy with your purchase. If you have any questions or need assistance, please don't hesitate to reach out to us.
        </p>

        ${shippingAddressSection}
        ${orderItemsSection}

        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
          <p style="font-size: 14px; color: #666; margin: 10px 0;">
            • Please check your order to ensure everything is correct<br>
            • We'd love to hear your feedback! Consider leaving a review for the products you purchased<br>
            • Keep your order number (#${data.orderNumber}) for your records
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dee2e6;">
          <p style="font-size: 14px; color: #666; margin: 10px 0;">
            If you have any concerns about your order or need to return an item, please contact our customer support team. We're here to help!
          </p>
        </div>

        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="font-size: 14px; color: #666; margin: 5px 0;">Thank you for shopping with Herbera!</p>
          <p style="font-size: 14px; color: #666; margin: 5px 0;">
            <a href="https://herbera.in" style="color: #007bff; text-decoration: none;">Visit Herbera</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

