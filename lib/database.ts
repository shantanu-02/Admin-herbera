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

export async function getProductBySlug(slug: string) {
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
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (productError) throw productError;

    // Get product variants, images, and review counts
    const [variantsResult, imagesResult, reviewsResult] = await Promise.all([
      supabaseAdmin!
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id),
      supabaseAdmin!
        .from("product_images")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order"),
      supabaseAdmin!
        .from("product_reviews")
        .select("id, rating, is_approved")
        .eq("product_id", product.id),
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
    console.error("Error fetching product by slug:", error);
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
  is_shipped?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("orders").select(`
      *,
      shipping_address:addresses!shipping_address_id(*),
      billing_address:addresses!billing_address_id(*),
      order_items(count)
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

    if (params.is_shipped !== undefined) {
      query = query.eq("is_shipped", params.is_shipped === "true");
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

    // Fetch profiles data separately
    const userIds = Array.from(
      new Set((data || []).map((order) => order.user_id))
    );
    let profilesData = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin!
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (!profilesError && profiles) {
        profilesData = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Add items_count and profiles to each order
    const ordersWithCount = (data || []).map((order) => ({
      ...order,
      items_count: order.order_items?.[0]?.count || 0,
      profiles: (profilesData as Record<string, any>)[order.user_id] || null,
    }));

    return {
      data: ordersWithCount,
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
        order_items(*),
        order_status_history(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Fetch profile data separately
    let profileData = null;
    if (order?.user_id) {
      const { data: profile, error: profileError } = await supabaseAdmin!
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", order.user_id)
        .single();

      if (!profileError && profile) {
        profileData = profile;
      }
    }

    return {
      ...order,
      profiles: profileData,
    };
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
        products!inner(id, name)
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

    // Fetch profiles data separately
    const userIds = Array.from(
      new Set((data || []).map((review) => review.user_id))
    );
    let profilesData = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin!
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (!profilesError && profiles) {
        profilesData = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Add profiles to each review
    const reviewsWithProfiles = (data || []).map((review) => ({
      ...review,
      profiles: (profilesData as Record<string, any>)[review.user_id] || null,
    }));

    return {
      data: reviewsWithProfiles,
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
      .select("*")
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

    // Fetch profiles data separately
    const userIds = Array.from(
      new Set((data || []).map((review) => review.user_id))
    );
    let profilesData = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin!
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (!profilesError && profiles) {
        profilesData = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Add profiles to each review
    const reviewsWithProfiles = (data || []).map((review) => ({
      ...review,
      profiles: (profilesData as Record<string, any>)[review.user_id] || null,
    }));

    return {
      data: reviewsWithProfiles,
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    throw error;
  }
}

// Check if user has purchased a product (for review verification)
export async function checkUserPurchase(userId: string, productId: string) {
  try {
    checkSupabaseAdmin();
    const { data, error } = await supabaseAdmin!
      .from("order_items")
      .select(
        `
        id,
        order_id,
        product_id,
        orders!inner(
          id,
          user_id,
          status,
          payment_status
        )
      `
      )
      .eq("product_id", productId)
      .eq("orders.user_id", userId)
      .eq("orders.payment_status", "paid")
      .limit(1);

    if (error) throw error;

    return {
      hasPurchased: (data && data.length > 0) || false,
      purchaseDetails: data?.[0] || null,
    };
  } catch (error) {
    console.error("Error checking user purchase:", error);
    throw error;
  }
}

// Blogs
export async function getBlogs(params: {
  q?: string;
  status?: string;
  author?: string;
  featured?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("blogs").select("*");

    if (params.q) {
      query = query.or(
        `title.ilike.%${params.q}%,content.ilike.%${params.q}%,excerpt.ilike.%${params.q}%`
      );
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.author) {
      query = query.eq("author_id", params.author);
    }

    if (params.featured !== undefined) {
      query = query.eq("is_featured", params.featured === "true");
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

    // Fetch profiles data separately
    const authorIds = Array.from(
      new Set((data || []).map((blog) => blog.author_id))
    );
    let profilesData = {};

    if (authorIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin!
        .from("profiles")
        .select("id, email, full_name")
        .in("id", authorIds);

      if (!profilesError && profiles) {
        profilesData = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Add profiles to each blog
    const blogsWithProfiles = (data || []).map((blog) => ({
      ...blog,
      profiles: (profilesData as Record<string, any>)[blog.author_id] || null,
    }));

    return {
      data: blogsWithProfiles,
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw error;
  }
}

export async function getBlogById(id: string) {
  try {
    checkSupabaseAdmin();
    const { data: blog, error } = await supabaseAdmin!
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Fetch profile data separately
    let profileData = null;
    if (blog?.author_id) {
      const { data: profile, error: profileError } = await supabaseAdmin!
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", blog.author_id)
        .single();

      if (!profileError && profile) {
        profileData = profile;
      }
    }

    return {
      ...blog,
      profiles: profileData,
    };
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw error;
  }
}

// Partners of Month
export async function getPartnersOfMonth(params: {
  q?: string;
  month_year?: string;
  active?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    checkSupabaseAdmin();
    let query = supabaseAdmin!.from("partners_of_month").select("*");

    if (params.q) {
      query = query.or(
        `name.ilike.%${params.q}%,bio.ilike.%${params.q}%,featured_quote.ilike.%${params.q}%`
      );
    }

    if (params.month_year) {
      query = query.eq("month_year", params.month_year);
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

    const { data, error, count } = await query.order("month_year", {
      ascending: false,
    });

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching partners of month:", error);
    throw error;
  }
}

export async function getPartnerOfMonthById(id: string) {
  try {
    checkSupabaseAdmin();
    const { data: partner, error } = await supabaseAdmin!
      .from("partners_of_month")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return partner;
  } catch (error) {
    console.error("Error fetching partner of month:", error);
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
