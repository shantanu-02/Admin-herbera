import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import {
  getPartnerOfMonthById,
  updateRecord,
  deleteRecord,
} from "@/lib/database";

async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const partner = await getPartnerOfMonthById(id);

    if (!partner) {
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

    return NextResponse.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    console.error("Partner GET error:", error);
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
    const updates = await request.json();
    const user = (request as any).user;

    // Prepare update data
    const updateData = {
      ...updates,
      updated_by: user.id,
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    const updatedPartner = await updateRecord(
      "partners_of_month",
      id,
      updateData
    );

    return NextResponse.json({
      success: true,
      data: updatedPartner,
    });
  } catch (error) {
    console.error("Partner PATCH error:", error);
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
    await deleteRecord("partners_of_month", id);

    return NextResponse.json({
      success: true,
      message: "Partner deleted successfully",
    });
  } catch (error) {
    console.error("Partner DELETE error:", error);
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
