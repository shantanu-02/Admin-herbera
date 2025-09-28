import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { checkUserPurchase } from "@/lib/database";

async function handlePOST(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMS",
            message: "userId and productId are required",
          },
        },
        { status: 400 }
      );
    }

    const result = await checkUserPurchase(userId, productId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Review verification error:", error);
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

export const POST = createAuthenticatedHandler(handlePOST);
