import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Get blog by ID (only published blogs for public API)
    const { data: blog, error } = await supabaseAdmin
      .from("blogs")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error) {
      console.error("Error fetching blog:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Blog not found",
            },
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // Increment view count
    await supabaseAdmin
      .from("blogs")
      .update({ view_count: (blog.view_count || 0) + 1 })
      .eq("id", id);

    // Format blog for public API response
    const formattedBlog = {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      featured_image_url: blog.featured_image_url,
      featured_image_alt: blog.featured_image_alt,
      published_at: blog.published_at,
      meta_title: blog.meta_title,
      meta_description: blog.meta_description,
      tags: blog.tags || [],
      view_count: (blog.view_count || 0) + 1,
      is_featured: blog.is_featured,
    };

    return NextResponse.json({
      success: true,
      data: formattedBlog,
    });
  } catch (error) {
    console.error("Public blog error:", error);
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

