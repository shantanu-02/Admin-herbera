import { NextRequest, NextResponse } from "next/server";

// Mock product variants data
const productVariants = {
  "1": [
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
      id: "9",
      product_id: "1",
      variant_name: "100ml",
      sku: "VCS-100ML-001",
      price: 2999,
      stock: 8,
      is_active: false,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-25T09:15:00Z",
    },
  ],
  "2": [
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
      id: "10",
      product_id: "2",
      variant_name: "200ml",
      sku: "NHO-200ML-001",
      price: 1599,
      stock: 20,
      is_active: true,
      created_at: "2024-01-10T08:15:00Z",
      updated_at: "2024-01-20T11:30:00Z",
    },
  ],
  "3": [
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
    {
      id: "11",
      product_id: "3",
      variant_name: "250ml",
      sku: "GFC-250ML-001",
      price: 999,
      stock: 30,
      is_active: true,
      created_at: "2024-01-05T12:00:00Z",
      updated_at: "2024-01-12T14:45:00Z",
    },
  ],
};

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
    const variants = productVariants[id as keyof typeof productVariants] || [];

    return NextResponse.json({
      success: true,
      data: variants,
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
    const { variant_name, sku, price, stock } = await request.json();

    // Validate input
    if (!variant_name || !sku || !price || stock === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Variant name, SKU, price, and stock are required",
          },
        },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
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

    if (typeof stock !== "number" || stock < 0) {
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

    // Check if SKU already exists (in real app, this would be a database check)
    const allVariants = Object.values(productVariants).flat();
    const existingVariant = allVariants.find((v) => v.sku === sku);

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

    // Create new variant
    const newVariant = {
      id: `variant_${Date.now()}`,
      product_id: id,
      variant_name,
      sku,
      price,
      stock,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to product variants
    if (!productVariants[id as keyof typeof productVariants]) {
      productVariants[id as keyof typeof productVariants] = [];
    }
    productVariants[id as keyof typeof productVariants].push(newVariant);

    return NextResponse.json({
      success: true,
      data: newVariant,
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
