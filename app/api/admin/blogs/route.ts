import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedHandler } from "@/lib/api-auth";
import { getBlogs, createRecord } from "@/lib/database";

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;
    const author = searchParams.get("author") || undefined;
    const featured = searchParams.get("featured") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getBlogs({
      q,
      status,
      author,
      featured,
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
    console.error("Blogs error:", error);
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
    const blogData = await request.json();

    // Generate slug from title if not provided
    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .trim();
    };

    // Prepare blog data
    const newBlog = {
      ...blogData,
      slug: blogData.slug || generateSlug(blogData.title),
      author_id: user.id,
      created_by: user.id,
      updated_by: user.id,
    };

    // If status is published, set published_at
    if (newBlog.status === "published" && !newBlog.published_at) {
      newBlog.published_at = new Date().toISOString();
    }

    const blog = await createRecord("blogs", newBlog);

    return NextResponse.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Blog creation error:", error);
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
