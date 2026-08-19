import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId as string;

    const resumes = await prisma.resume.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fileName: true,
        extractedText: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.error("Resume list error:", error);

    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}