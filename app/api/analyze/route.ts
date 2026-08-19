import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    // Get analysis ID
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    // Authentication
    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { payload } =
      await jwtVerify(token, secret);

    const userId =
      payload.userId as string;

    // Make sure analysis belongs to this user
    const analysis =
      await prisma.analysis.findFirst({
        where: {
          id,
          userId,
        },
        select: {
          id: true,
        },
      });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Delete analysis
    await prisma.analysis.delete({
      where: {
        id: analysis.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Analysis deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete analysis error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete analysis",
      },
      {
        status: 500,
      }
    );
  }
}