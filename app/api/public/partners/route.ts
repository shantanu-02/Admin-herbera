import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const q = searchParams.get("q");
    const month_year = searchParams.get("month_year");
    const active = searchParams.get("active") || "true";
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

    // Build query for active partners only
    let query = supabaseAdmin
      .from("partners_of_month")
      .select("*")
      .eq("is_active", true);

    // Apply search filter
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,bio.ilike.%${q}%,featured_quote.ilike.%${q}%`
      );
    }

    // Apply month filter
    if (month_year) {
      query = query.eq("month_year", month_year);
    }

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: partners, error, count } = await query.order("month_year", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching partners:", error);
      throw error;
    }

    // Format partners for public API response
    const formattedPartners = (partners || []).map((partner) => ({
      id: partner.id,
      name: partner.name,
      bio: partner.bio,
      photo_url: partner.photo_url,
      photo_alt: partner.photo_alt,
      instagram_url: partner.instagram_url,
      facebook_url: partner.facebook_url,
      twitter_url: partner.twitter_url,
      youtube_url: partner.youtube_url,
      tiktok_url: partner.tiktok_url,
      other_social_links: partner.other_social_links,
      sales_count: partner.sales_count || 0,
      revenue_generated: partner.revenue_generated || 0,
      month_year: partner.month_year,
      featured_quote: partner.featured_quote,
      achievements: partner.achievements || [],
    }));

    return NextResponse.json({
      success: true,
      data: formattedPartners,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("Public partners error:", error);
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






