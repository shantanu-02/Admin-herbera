import { NextRequest, NextResponse } from "next/server";

// Mock orders data for status updates (simplified version)
const orders = [
  {
    id: "1",
    order_number: "ORD20240101001",
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

export async function POST(
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
    const { status, notes } = await request.json();

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

    // Create new status entry
    const newStatusEntry = {
      id: `status_${Date.now()}`,
      order_id: id,
      status,
      notes: notes || `Order status updated to ${status}`,
      changed_at: new Date().toISOString(),
    };

    // Add to order's status history
    orders[orderIndex].status_history.push(newStatusEntry);

    return NextResponse.json({
      success: true,
      data: newStatusEntry,
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
