import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getReviews } from "@/lib/database";

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const is_approved = searchParams.get("is_approved") || undefined;
    const rating = searchParams.get("rating") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getReviews({
      q,
      is_approved,
      rating,
      limit,
      offset,
    });

    // Format the response to match the expected structure
    const formattedReviews = result.data.map((review) => ({
      ...review,
      product: {
        id: review.products?.id,
        name: review.products?.name,
      },
      user: {
        id: review.profiles?.id || review.user_id,
        email: review.profiles?.email || "",
        full_name: review.profiles?.full_name || "",
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedReviews,
      pagination: {
        total: result.total,
        limit,
        offset,
        has_more: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Reviews error:", error);
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

export const GET = createAuthenticatedHandler(handler);
