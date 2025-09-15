import { NextRequest, NextResponse } from "next/server";

// Mock products data (same as in the list endpoint)
const products = [
  {
    id: "1",
    name: "Vitamin C Face Serum",
    description:
      "A powerful antioxidant serum that brightens skin and reduces fine lines. Perfect for daily use.",
    category_id: "1",
    price: 1299,
    weight_kg: 0.03,
    length_cm: 3.2,
    breadth_cm: 3.2,
    height_cm: 10.5,
    discount_percent: 15,
    stock: 25,
    rating: 4.7,
    is_active: true,
    sku: "VCS-30ML-001",
    ingredients: ["Vitamin C", "Hyaluronic Acid", "Niacinamide", "Aloe Vera"],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
    images: [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1556228578-dd6f6884d96d?w=400",
        alt_text: "Vitamin C Face Serum - 30ml bottle",
        sort_order: 0,
      },
    ],
    variants: [
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
    ],
  },
  {
    id: "2",
    name: "Nourishing Hair Oil",
    description:
      "Natural hair oil blend that promotes hair growth and adds shine. Made with organic ingredients.",
    category_id: "2",
    price: 899,
    weight_kg: 0.05,
    length_cm: 4.0,
    breadth_cm: 4.0,
    height_cm: 15.2,
    discount_percent: 10,
    stock: 40,
    rating: 4.5,
    is_active: true,
    sku: "NHO-100ML-001",
    ingredients: ["Coconut Oil", "Argan Oil", "Rosemary Extract", "Vitamin E"],
    created_at: "2024-01-10T08:15:00Z",
    updated_at: "2024-01-18T16:20:00Z",
    images: [
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1595348020949-87cdfbb44174?w=400",
        alt_text: "Nourishing Hair Oil - 100ml bottle",
        sort_order: 0,
      },
    ],
    variants: [
      {
        id: "3",
        variant_name: "100ml",
        sku: "NHO-100ML-001",
        price: 899,
        stock: 40,
        is_active: true,
      },
    ],
  },
  {
    id: "3",
    name: "Gentle Face Cleanser",
    description:
      "Mild foaming cleanser suitable for all skin types. Removes impurities without stripping natural oils.",
    category_id: "1",
    price: 649,
    weight_kg: 0.12,
    length_cm: 5.5,
    breadth_cm: 3.2,
    height_cm: 18.0,
    discount_percent: 0,
    stock: 50,
    rating: 4.3,
    is_active: true,
    sku: "GFC-150ML-001",
    ingredients: ["Glycerin", "Aloe Vera", "Chamomile Extract", "Green Tea"],
    created_at: "2024-01-05T12:00:00Z",
    updated_at: "2024-01-15T09:30:00Z",
    images: [
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400",
        alt_text: "Gentle Face Cleanser - 150ml tube",
        sort_order: 0,
      },
    ],
    variants: [
      {
        id: "4",
        variant_name: "150ml",
        sku: "GFC-150ML-001",
        price: 649,
        stock: 50,
        is_active: true,
      },
    ],
  },
];

const categories = [
  { id: "1", name: "Skincare", slug: "skincare" },
  { id: "2", name: "Haircare", slug: "haircare" },
  { id: "3", name: "Body Care", slug: "body-care" },
];

// Mock reviews for products
const reviews = {
  "1": [
    {
      id: "1",
      title: "Amazing results!",
      review_text:
        "This serum has transformed my skin. Noticed brighter complexion within just 2 weeks.",
      rating: 5,
      is_verified_purchase: true,
      created_at: "2024-01-18T10:30:00Z",
    },
    {
      id: "2",
      title: "Good value for money",
      review_text:
        "Works well, though takes time to see results. Worth the investment.",
      rating: 4,
      is_verified_purchase: true,
      created_at: "2024-01-16T14:20:00Z",
    },
  ],
  "2": [
    {
      id: "3",
      title: "Love this hair oil",
      review_text:
        "My hair feels so much softer and shinier. Will definitely repurchase.",
      rating: 5,
      is_verified_purchase: true,
      created_at: "2024-01-17T09:15:00Z",
    },
  ],
  "3": [
    {
      id: "4",
      title: "Gentle and effective",
      review_text:
        "Perfect for sensitive skin. Cleanses well without drying out my face.",
      rating: 4,
      is_verified_purchase: true,
      created_at: "2024-01-12T16:45:00Z",
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find the product
    const product = products.find((p) => p.id === id && p.is_active);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Product not found",
          },
        },
        { status: 404 }
      );
    }

    // Get category info
    const category = categories.find((c) => c.id === product.category_id);

    // Get product reviews
    const productReviews = reviews[id] || [];
    const approvedReviews = productReviews; // All reviews in mock data are approved
    const averageRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
          approvedReviews.length
        : 0;

    // Format response
    const response = {
      id: product.id,
      name: product.name,
      description: product.description,
      category: {
        id: category?.id || "",
        name: category?.name || "",
        slug: category?.slug || "",
      },
      price: product.price,
      weight_kg: product.weight_kg,
      length_cm: product.length_cm,
      breadth_cm: product.breadth_cm,
      height_cm: product.height_cm,
      discount_percent: product.discount_percent,
      stock: product.stock,
      rating: product.rating,
      is_active: product.is_active,
      sku: product.sku,
      ingredients: product.ingredients,
      images: product.images,
      variants: product.variants.filter((variant) => variant.is_active),
      reviews: {
        average_rating: parseFloat(averageRating.toFixed(1)),
        total_count: approvedReviews.length,
        recent_reviews: approvedReviews.slice(0, 5), // Show max 5 recent reviews
      },
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
