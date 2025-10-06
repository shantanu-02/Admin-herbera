import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const q = searchParams.get("q");
    const status = searchParams.get("status") || "published";
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL",
            message: "Database connection not available",
          },
        },
        { status: 500 }
      );
    }

    // Build query for published blogs only
    let query = supabaseAdmin
      .from("blogs")
      .select("*")
      .eq("status", "published");

    // Apply search filter
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,content.ilike.%${q}%,excerpt.ilike.%${q}%`
      );
    }

    // Apply featured filter
    if (featured !== undefined) {
      query = query.eq("is_featured", featured === "true");
    }

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: blogs, error, count } = await query.order("published_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching blogs:", error);
      throw error;
    }

    // Format blogs for public API response
    const formattedBlogs = (blogs || []).map((blog) => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      featured_image_url: blog.featured_image_url,
      featured_image_alt: blog.featured_image_alt,
      published_at: blog.published_at,
      meta_title: blog.meta_title,
      meta_description: blog.meta_description,
      tags: blog.tags || [],
      view_count: blog.view_count || 0,
      is_featured: blog.is_featured,
    }));

    return NextResponse.json({
      success: true,
      data: formattedBlogs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("Public blogs error:", error);
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



