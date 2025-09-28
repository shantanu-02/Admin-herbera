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

    // Get partner by ID (only active partners for public API)
    const { data: partner, error } = await supabaseAdmin
      .from("partners_of_month")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching partner:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Partner not found",
            },
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // Format partner for public API response
    const formattedPartner = {
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
    };

    return NextResponse.json({
      success: true,
      data: formattedPartner,
    });
  } catch (error) {
    console.error("Public partner error:", error);
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

