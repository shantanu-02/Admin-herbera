import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getPartnersOfMonth, createRecord } from "@/lib/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const month_year = searchParams.get("month_year") || undefined;
    const active = searchParams.get("active") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getPartnersOfMonth({
      q,
      month_year,
      active,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit,
        offset,
        has_more: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Partners error:", error);
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

async function handlePOST(request: NextRequest) {
  try {
    const user = (request as any).user;
    const partnerData = await request.json();

    // Prepare partner data
    const newPartner = {
      ...partnerData,
      created_by: user.id,
      updated_by: user.id,
    };

    const partner = await createRecord("partners_of_month", newPartner);

    return NextResponse.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    console.error("Partner creation error:", error);
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
export const POST = createAuthenticatedHandler(handlePOST);
