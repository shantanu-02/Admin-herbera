import { NextRequest, NextResponse } from "next/server";

// Mock products data - same structure as admin but filtered for public
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
    review_count: 24,
    average_rating: 4.7,
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
    review_count: 18,
    average_rating: 4.5,
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
    review_count: 32,
    average_rating: 4.3,
  },
];

const categories = [
  { id: "1", name: "Skincare", slug: "skincare" },
  { id: "2", name: "Haircare", slug: "haircare" },
  { id: "3", name: "Body Care", slug: "body-care" },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const q = searchParams.get("q");
    const category_id = searchParams.get("category_id");
    const min_price = searchParams.get("min_price");
    const max_price = searchParams.get("max_price");
    const min_rating = searchParams.get("min_rating");
    const sort = searchParams.get("sort") || "created_desc";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filter only active products for public API
    let filteredProducts = products.filter((product) => product.is_active);

    // Apply search filter
    if (q) {
      const searchTerm = q.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (category_id) {
      filteredProducts = filteredProducts.filter(
        (product) => product.category_id === category_id
      );
    }

    // Apply price filters
    if (min_price) {
      const minPrice = parseFloat(min_price);
      filteredProducts = filteredProducts.filter(
        (product) => product.price >= minPrice
      );
    }

    if (max_price) {
      const maxPrice = parseFloat(max_price);
      filteredProducts = filteredProducts.filter(
        (product) => product.price <= maxPrice
      );
    }

    // Apply rating filter
    if (min_rating) {
      const minRating = parseFloat(min_rating);
      filteredProducts = filteredProducts.filter(
        (product) => product.rating >= minRating
      );
    }

    // Apply sorting
    switch (sort) {
      case "price_asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "rating_desc":
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case "discount_desc":
        filteredProducts.sort(
          (a, b) => b.discount_percent - a.discount_percent
        );
        break;
      case "created_desc":
      default:
        filteredProducts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    // Apply pagination
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Format products for public API response
    const formattedProducts = paginatedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
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
      created_at: product.created_at,
      updated_at: product.updated_at,
      images: product.images,
      variants: product.variants,
      review_count: product.review_count,
      average_rating: product.average_rating,
    }));

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
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
