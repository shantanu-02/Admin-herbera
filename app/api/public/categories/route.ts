import { NextRequest, NextResponse } from "next/server";

// Mock categories data
const categories = [
  {
    id: "1",
    name: "Skincare",
    description:
      "Complete skincare solutions including cleansers, serums, moisturizers, and treatments for all skin types.",
    slug: "skincare",
    product_count: 15,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Haircare",
    description:
      "Natural hair care products including oils, shampoos, conditioners, and hair masks for healthy hair.",
    slug: "haircare",
    product_count: 8,
    is_active: true,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-10T14:20:00Z",
  },
  {
    id: "3",
    name: "Body Care",
    description:
      "Nourishing body care essentials including lotions, scrubs, and body oils for smooth, healthy skin.",
    slug: "body-care",
    product_count: 12,
    is_active: true,
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-12T09:45:00Z",
  },
  {
    id: "4",
    name: "Wellness",
    description:
      "Holistic wellness products including supplements, aromatherapy, and self-care essentials.",
    slug: "wellness",
    product_count: 6,
    is_active: true,
    created_at: "2024-01-04T00:00:00Z",
    updated_at: "2024-01-08T16:10:00Z",
  },
];

export async function GET(request: NextRequest) {
  try {
    // Filter only active categories for public API
    const activeCategories = categories.filter(
      (category) => category.is_active
    );

    // Format for public response - only show necessary fields
    const formattedCategories = activeCategories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      product_count: category.product_count,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCategories,
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
