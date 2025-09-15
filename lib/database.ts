import { supabaseAdmin } from "./supabase";

// Helper function to check if supabaseAdmin is available
function checkSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not available");
  }
}

// Dashboard Stats
export async function getDashboardStats() {
  try {
    checkSupabaseAdmin();
    const [
      productsResult,
      ordersResult,
      categoriesResult,
      couponsResult,
      reviewsResult,
    ] = await Promise.all([
      supabaseAdmin!
        .from("products")
        .select("id, is_active")
        .eq("is_active", true),
      supabaseAdmin!
        .from("orders")
        .select("id, total_amount, status, placed_at, user_id"),
      supabaseAdmin!.from("categories").select("id"),
      supabaseAdmin!
        .from("coupons")
        .select("id, is_active")
        .eq("is_active", true),
      supabaseAdmin!
        .from("product_reviews")
        .select("id, is_approved")
        .eq("is_approved", false),
    ]);

    const orders = ordersResult.data || [];
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthOrders = orders.filter(
      (order) => new Date(order.placed_at) >= thisMonth
    );

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );
    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );

    return {
      total_products: productsResult.data?.length || 0,
      total_orders: orders.length,
      total_customers: new Set(orders.map((o) => o.user_id)).size, // Unique customers
      total_revenue: totalRevenue,
      active_categories: categoriesResult.data?.length || 0,
      active_coupons: couponsResult.data?.length || 0,
      this_month_orders: thisMonthOrders.length,
      this_month_revenue: thisMonthRevenue,
      pending_reviews: reviewsResult.data?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

// Products
export async function getProducts(params: {
  q?: string;
  category?: string;
  active?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("products").select(`
        *,
        categories(id, name, slug),
        product_images(id, url, alt_text, sort_order)
      `);

    if (params.q) {
      query = query.or(
        `name.ilike.%${params.q}%,description.ilike.%${params.q}%,sku.ilike.%${params.q}%`
      );
    }

    if (params.category) {
      query = query.eq("category_id", params.category);
    }

    if (params.active !== undefined) {
      query = query.eq("is_active", params.active === "true");
    }

    if (params.limit) {
      query = query.range(
        params.offset || 0,
        (params.offset || 0) + params.limit - 1
      );
    }

    const { data, error, count } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Database error in getProducts:", error);
      throw error;
    }

    // Fetch images separately since relationship join didn't work
    if (data && data.length > 0) {
      const productIds = data.map((p) => p.id);

      const { data: images, error: imagesError } = await supabaseAdmin!
        .from("product_images")
        .select("*")
        .in("product_id", productIds)
        .order("sort_order");

      if (imagesError) {
        console.error("Error fetching product images:", imagesError);
      } else {
        // Attach images to products
        data.forEach((product) => {
          product.images =
            images?.filter((img) => img.product_id === product.id) || [];
        });
      }
    }

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export async function getProductById(id: string) {
  try {
    checkSupabaseAdmin();
    const { data: product, error: productError } = await supabaseAdmin!
      .from("products")
      .select(
        `
        *,
        categories!inner(id, name, slug)
      `
      )
      .eq("id", id)
      .single();

    if (productError) throw productError;

    // Get product variants, images, and review counts
    const [variantsResult, imagesResult, reviewsResult] = await Promise.all([
      supabaseAdmin!.from("product_variants").select("*").eq("product_id", id),
      supabaseAdmin!
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("sort_order"),
      supabaseAdmin!
        .from("product_reviews")
        .select("id, rating, is_approved")
        .eq("product_id", id),
    ]);

    const reviews = reviewsResult.data || [];
    const approvedReviews = reviews.filter((r) => r.is_approved);

    return {
      ...product,
      variants: variantsResult.data || [],
      images: imagesResult.data || [],
      reviews: {
        total_count: reviews.length,
        approved_count: approvedReviews.length,
        pending_count: reviews.length - approvedReviews.length,
        average_rating:
          approvedReviews.length > 0
            ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
              approvedReviews.length
            : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

// Categories
export async function getCategories(params: {
  q?: string;
  category?: string;
  active?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("categories").select("*");

    if (params.q) {
      query = query.or(
        `name.ilike.%${params.q}%,description.ilike.%${params.q}%`
      );
    }

    if (params.limit) {
      query = query.range(
        params.offset || 0,
        (params.offset || 0) + params.limit - 1
      );
    }

    const { data, error, count } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

// Orders
export async function getOrders(params: {
  q?: string;
  status?: string;
  payment_status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("orders").select(`
      *,
      shipping_address:addresses!shipping_address_id(*),
      billing_address:addresses!billing_address_id(*),
      profiles!user_id(email, full_name)
    `);

    if (params.q) {
      query = query.or(`order_number.ilike.%${params.q}%`);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.payment_status) {
      query = query.eq("payment_status", params.payment_status);
    }

    if (params.limit) {
      query = query.range(
        params.offset || 0,
        (params.offset || 0) + params.limit - 1
      );
    }

    const { data, error, count } = await query.order("placed_at", {
      ascending: false,
    });

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

export async function getOrderById(id: string) {
  try {
    checkSupabaseAdmin();
    const { data: order, error } = await supabaseAdmin!
      .from("orders")
      .select(
        `
        *,
        shipping_address:addresses!shipping_address_id(*),
        billing_address:addresses!billing_address_id(*),
        profiles!user_id(email, full_name),
        order_items(*),
        order_status_history(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return order;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}

// Coupons
export async function getCoupons(params: {
  q?: string;
  type?: string;
  active?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("coupons").select("*");

    if (params.q) {
      query = query.or(`code.ilike.%${params.q}%,name.ilike.%${params.q}%`);
    }

    if (params.type) {
      query = query.eq("type", params.type);
    }

    if (params.active !== undefined) {
      query = query.eq("is_active", params.active === "true");
    }

    if (params.limit) {
      query = query.range(
        params.offset || 0,
        (params.offset || 0) + params.limit - 1
      );
    }

    const { data, error, count } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching coupons:", error);
    throw error;
  }
}

export async function getCouponUsage(couponId: string) {
  try {
    checkSupabaseAdmin();
    // Get coupon details
    const { data: coupon, error: couponError } = await supabaseAdmin!
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .single();

    if (couponError) throw couponError;

    // Get usage statistics
    const { data: usageData, error: usageError } = await supabaseAdmin!
      .from("coupon_usage")
      .select(
        `
        *,
        orders(order_number),
        profiles!user_id(email)
      `
      )
      .eq("coupon_id", couponId)
      .order("used_at", { ascending: false });

    if (usageError) throw usageError;

    const totalUses = usageData.length;
    const totalDiscount = usageData.reduce(
      (sum, usage) => sum + usage.discount_amount,
      0
    );
    const remainingUses = coupon.usage_limit
      ? coupon.usage_limit - totalUses
      : -1;

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
      },
      usage_stats: {
        total_uses: totalUses,
        usage_limit: coupon.usage_limit || 0,
        remaining_uses: remainingUses,
        total_discount_given: totalDiscount,
        first_used:
          usageData.length > 0 ? usageData[usageData.length - 1].used_at : null,
        last_used: usageData.length > 0 ? usageData[0].used_at : null,
      },
      recent_usage: usageData.slice(0, 10).map((usage) => ({
        id: usage.id,
        order_id: usage.orders?.order_number || usage.order_id,
        user_id: usage.profiles?.email || usage.user_id,
        discount_amount: usage.discount_amount,
        used_at: usage.used_at,
      })),
    };
  } catch (error) {
    console.error("Error fetching coupon usage:", error);
    throw error;
  }
}

// Reviews
export async function getReviews(params: {
  q?: string;
  is_approved?: string;
  rating?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("product_reviews").select(`
        *,
        products!inner(id, name),
        profiles(id, email, full_name)
      `);

    if (params.q) {
      query = query.or(
        `title.ilike.%${params.q}%,review_text.ilike.%${params.q}%`
      );
    }

    if (params.is_approved !== undefined) {
      query = query.eq("is_approved", params.is_approved === "true");
    }

    if (params.rating) {
      query = query.eq("rating", parseInt(params.rating));
    }

    if (params.limit) {
      query = query.range(
        params.offset || 0,
        (params.offset || 0) + params.limit - 1
      );
    }

    const { data, error, count } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
}

export async function getProductReviews(
  productId: string,
  params: {
    is_approved?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!
      .from("product_reviews")
      .select(
        `
        *,
        profiles!user_id(id, email, full_name)
      `
      )
      .eq("product_id", productId);

    if (params.is_approved !== undefined) {
      query = query.eq("is_approved", params.is_approved === "true");
    }

    if (params.limit) {
      query = query.range(
        params.offset || 0,
        (params.offset || 0) + params.limit - 1
      );
    }

    const { data, error, count } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    throw error;
  }
}

// Generic CRUD operations
export async function createRecord(table: string, data: any) {
  try {
    checkSupabaseAdmin();
    const { data: record, error } = await supabaseAdmin!
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return record;
  } catch (error) {
    console.error(`Error creating ${table} record:`, error);
    throw error;
  }
}

export async function updateRecord(table: string, id: string, data: any) {
  try {
    checkSupabaseAdmin();
    const { data: record, error } = await supabaseAdmin!
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return record;
  } catch (error) {
    console.error(`Error updating ${table} record:`, error);
    throw error;
  }
}

export async function deleteRecord(table: string, id: string) {
  try {
    checkSupabaseAdmin();
    const { error } = await supabaseAdmin!.from(table).delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting ${table} record:`, error);
    throw error;
  }
}
