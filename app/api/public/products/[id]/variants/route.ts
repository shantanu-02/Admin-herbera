import { NextRequest, NextResponse } from "next/server";

// Mock product variants data
const productVariants = {
  "1": [
    {
      id: "1",
      variant_name: "30ml",
      sku: "VCS-30ML-001",
      price: 1299,
      stock: 25,
      is_active: true,
    },
    {
      id: "2",
      variant_name: "50ml",
      sku: "VCS-50ML-001",
      price: 1899,
      stock: 15,
      is_active: true,
    },
    {
      id: "9",
      variant_name: "100ml",
      sku: "VCS-100ML-001",
      price: 2999,
      stock: 8,
      is_active: true,
    },
  ],
  "2": [
    {
      id: "3",
      variant_name: "100ml",
      sku: "NHO-100ML-001",
      price: 899,
      stock: 40,
      is_active: true,
    },
    {
      id: "10",
      variant_name: "200ml",
      sku: "NHO-200ML-001",
      price: 1599,
      stock: 20,
      is_active: true,
    },
  ],
  "3": [
    {
      id: "4",
      variant_name: "150ml",
      sku: "GFC-150ML-001",
      price: 649,
      stock: 50,
      is_active: true,
    },
    {
      id: "11",
      variant_name: "250ml",
      sku: "GFC-250ML-001",
      price: 999,
      stock: 30,
      is_active: true,
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get variants for this product (only active variants for public API)
    const variants = productVariants[id] || [];
    const activeVariants = variants.filter((variant) => variant.is_active);

    // Format variants for public API response
    const formattedVariants = activeVariants.map((variant) => ({
      id: variant.id,
      variant_name: variant.variant_name,
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      is_active: variant.is_active,
    }));

    return NextResponse.json({
      success: true,
      data: formattedVariants,
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
