import { NextRequest, NextResponse } from "next/server";

// Mock variants data for individual variant operations
const variants = [
  {
    id: "1",
    product_id: "1",
    variant_name: "30ml",
    sku: "VCS-30ML-001",
    price: 1299,
    stock: 25,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
  },
  {
    id: "2",
    product_id: "1",
    variant_name: "50ml",
    sku: "VCS-50ML-001",
    price: 1899,
    stock: 15,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-18T16:20:00Z",
  },
  {
    id: "3",
    product_id: "2",
    variant_name: "100ml",
    sku: "NHO-100ML-001",
    price: 899,
    stock: 40,
    is_active: true,
    created_at: "2024-01-10T08:15:00Z",
    updated_at: "2024-01-18T16:20:00Z",
  },
  {
    id: "4",
    product_id: "3",
    variant_name: "150ml",
    sku: "GFC-150ML-001",
    price: 649,
    stock: 50,
    is_active: true,
    created_at: "2024-01-05T12:00:00Z",
    updated_at: "2024-01-15T09:30:00Z",
  },
];

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  return auth?.startsWith("Bearer admin_token_") || false;
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

    const variantIndex = variants.findIndex((v) => v.id === id);
    if (variantIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Variant not found",
          },
        },
        { status: 404 }
      );
    }

    // Validate updates
    if (
      updates.price !== undefined &&
      (typeof updates.price !== "number" || updates.price <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Price must be a positive number",
          },
        },
        { status: 400 }
      );
    }

    if (
      updates.stock !== undefined &&
      (typeof updates.stock !== "number" || updates.stock < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Stock must be a non-negative number",
          },
        },
        { status: 400 }
      );
    }

    // Check if SKU already exists (if being updated)
    if (updates.sku && updates.sku !== variants[variantIndex].sku) {
      const existingVariant = variants.find(
        (v) => v.sku === updates.sku && v.id !== id
      );
      if (existingVariant) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "A variant with this SKU already exists",
            },
          },
          { status: 409 }
        );
      }
    }

    // Update variant
    const updatedVariant = {
      ...variants[variantIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    variants[variantIndex] = updatedVariant;

    return NextResponse.json({
      success: true,
      data: {
        id: updatedVariant.id,
        variant_name: updatedVariant.variant_name,
        sku: updatedVariant.sku,
        price: updatedVariant.price,
        stock: updatedVariant.stock,
        is_active: updatedVariant.is_active,
        updated_at: updatedVariant.updated_at,
      },
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

export async function DELETE(
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
    const variantIndex = variants.findIndex((v) => v.id === id);

    if (variantIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Variant not found",
          },
        },
        { status: 404 }
      );
    }

    // Remove variant from array
    variants.splice(variantIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Variant deleted successfully",
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
