import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

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

    // Get reviews for this product (only approved reviews for public API)
    let query = supabaseAdmin
      .from("product_reviews")
      .select(
        `
        id,
        title,
        review_text,
        rating,
        is_verified_purchase,
        helpful_count,
        created_at
      `
      )
      .eq("product_id", id)
      .eq("is_approved", true);

    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const {
      data: reviews,
      error,
      count,
    } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: reviews || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("Public reviews error:", error);
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
