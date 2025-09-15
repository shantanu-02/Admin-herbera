import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { updateRecord, deleteRecord } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase";

async function handleGET(
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

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Coupon not found",
            },
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Coupon GET error:", error);
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

async function handlePATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    const user = (request as any).user;

    // Prepare update data
    const updateData = {
      ...data,
      updated_by: user.id,
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    const updatedCoupon = await updateRecord("coupons", id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedCoupon,
    });
  } catch (error: any) {
    console.error("Coupon PATCH error:", error);

    if (error?.message?.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A coupon with this code already exists",
          },
        },
        { status: 409 }
      );
    }

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

async function handleDELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deleteRecord("coupons", id);

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Coupon DELETE error:", error);
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

export const GET = createAuthenticatedHandler(handleGET);
export const PATCH = createAuthenticatedHandler(handlePATCH);
export const DELETE = createAuthenticatedHandler(handleDELETE);
