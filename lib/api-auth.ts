import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "./auth";

export async function withAdminAuth<T extends any[]>(
  request: NextRequest,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  const authHeader = request.headers.get("authorization");
  const user = await verifyAdminToken(authHeader);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      },
      { status: 401 }
    );
  }

  // Add user info to request for handlers that need it
  (request as any).user = user;

  return handler(request, ...([] as unknown as T));
}

export function createAuthenticatedHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const authHeader = request.headers.get("authorization");
    const user = await verifyAdminToken(authHeader);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // Add user info to request for handlers that need it
    (request as any).user = user;

    return handler(request, ...args);
  };
}
