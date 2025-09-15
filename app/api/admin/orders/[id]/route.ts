import { NextRequest, NextResponse } from "next/server";

// Mock orders data with detailed information
const orders = [
  {
    id: "1",
    order_number: "ORD20240101001",
    user_id: "user1",
    status: "shipped",
    payment_status: "paid",
    payment_method: "UPI",
    subtotal: 2000,
    shipping_charges: 100,
    discount: 200,
    total_amount: 1900,
    courier_name: "BlueDart",
    tracking_id: "BD123456789",
    tracking_url: "https://tracking.bluedart.com/BD123456789",
    placed_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T14:00:00Z",
    shipping_address: {
      id: "addr1",
      recipient_name: "John Doe",
      phone: "+91 9876543210",
      line1: "123 Main Street",
      line2: "Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      postal_code: "400001",
      country: "India",
    },
    billing_address: {
      id: "addr2",
      recipient_name: "John Doe",
      phone: "+91 9876543210",
      line1: "123 Main Street",
      line2: "Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      postal_code: "400001",
      country: "India",
    },
    customer: {
      id: "user1",
      email: "customer@example.com",
    },
    items: [
      {
        id: "item1",
        product_id: "1",
        sku: "VCS-30ML-001",
        name: "Vitamin C Face Serum",
        price: 1299,
        quantity: 1,
        total: 1299,
      },
      {
        id: "item2",
        product_id: "2",
        sku: "NHO-100ML-001",
        name: "Nourishing Hair Oil",
        price: 899,
        quantity: 1,
        total: 899,
      },
    ],
    status_history: [
      {
        id: "status1",
        status: "pending",
        notes: "Order created and awaiting payment",
        changed_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "status2",
        status: "paid",
        notes: "Payment received successfully via UPI",
        changed_at: "2024-01-01T10:30:00Z",
      },
      {
        id: "status3",
        status: "shipped",
        notes: "Order shipped via BlueDart with tracking ID: BD123456789",
        changed_at: "2024-01-01T12:00:00Z",
      },
    ],
  },
  {
    id: "2",
    order_number: "ORD20240102002",
    user_id: "user2",
    status: "pending",
    payment_status: "pending",
    payment_method: "Credit Card",
    subtotal: 1500,
    shipping_charges: 100,
    discount: 0,
    total_amount: 1600,
    courier_name: "",
    tracking_id: "",
    tracking_url: "",
    placed_at: "2024-01-02T15:00:00Z",
    updated_at: "2024-01-02T15:00:00Z",
    shipping_address: {
      id: "addr3",
      recipient_name: "Jane Smith",
      phone: "+91 9876543211",
      line1: "456 Park Avenue",
      line2: "",
      city: "Delhi",
      state: "Delhi",
      postal_code: "110001",
      country: "India",
    },
    billing_address: {
      id: "addr4",
      recipient_name: "Jane Smith",
      phone: "+91 9876543211",
      line1: "456 Park Avenue",
      line2: "",
      city: "Delhi",
      state: "Delhi",
      postal_code: "110001",
      country: "India",
    },
    customer: {
      id: "user2",
      email: "jane@example.com",
    },
    items: [
      {
        id: "item3",
        product_id: "3",
        sku: "GFC-150ML-001",
        name: "Gentle Face Cleanser",
        price: 649,
        quantity: 2,
        total: 1298,
      },
    ],
    status_history: [
      {
        id: "status4",
        status: "pending",
        notes: "Order created and awaiting payment confirmation",
        changed_at: "2024-01-02T15:00:00Z",
      },
    ],
  },
];

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  return auth?.startsWith("Bearer admin_token_") || false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    const { id } = params;
    const order = orders.find((o) => o.id === id);

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    const { id } = params;
    const updates = await request.json();

    const orderIndex = orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
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

    // Update order with provided fields
    const order = orders[orderIndex];
    const updatedOrder = {
      ...order,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If status is being updated, add to status history
    if (updates.status && updates.status !== order.status) {
      updatedOrder.status_history = [
        ...order.status_history,
        {
          id: `status_${Date.now()}`,
          status: updates.status,
          notes: updates.notes || `Status updated to ${updates.status}`,
          changed_at: new Date().toISOString(),
        },
      ];
    }

    orders[orderIndex] = updatedOrder;

    // Return simplified response
    const response = {
      id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      status: updatedOrder.status,
      payment_status: updatedOrder.payment_status,
      courier_name: updatedOrder.courier_name,
      tracking_id: updatedOrder.tracking_id,
      tracking_url: updatedOrder.tracking_url,
      updated_at: updatedOrder.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: response,
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
