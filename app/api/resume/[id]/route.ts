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
  context: RouteContext
) {
  try {
    // ==========================================
    // 1. CHECK AUTHENTICATION
    // ==========================================

    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // 2. VERIFY TOKEN
    // ==========================================

    const { payload } =
      await jwtVerify(token, secret);

    const userId =
      payload.userId as string;

    // ==========================================
    // 3. GET RESUME ID
    // ==========================================

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Resume ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 4. FIND RESUME
    // ==========================================

    const resume =
      await prisma.resume.findFirst({
        where: {
          id,
          userId,
        },
      });

    if (!resume) {
      return NextResponse.json(
        {
          error: "Resume not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // 5. DELETE RELATED ANALYSES
    // ==========================================

    await prisma.analysis.deleteMany({
      where: {
        resumeId: resume.id,
        userId,
      },
    });

    // ==========================================
    // 6. DELETE RESUME
    // ==========================================

    await prisma.resume.delete({
      where: {
        id: resume.id,
      },
    });

    // ==========================================
    // 7. SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete resume error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete resume",
      },
      {
        status: 500,
      }
    );
  }
}