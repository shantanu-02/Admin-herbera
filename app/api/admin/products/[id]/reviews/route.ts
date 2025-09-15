import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getProductReviews } from "@/lib/database";

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const is_approved = searchParams.get("is_approved") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getProductReviews(id, {
      is_approved,
      limit,
      offset,
    });

    // Format the response to match the expected structure
    const formattedReviews = result.data.map((review) => ({
      ...review,
      user: {
        id: review.profiles?.id || review.user_id,
        email: review.profiles?.email || "",
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
    console.error("Product reviews error:", error);
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
