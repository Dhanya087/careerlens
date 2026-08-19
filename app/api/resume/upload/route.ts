import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function POST(request: Request) {
  try {
    // ==========================================
    // CHECK LOGIN
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
    // VERIFY JWT
    // ==========================================

    const { payload } =
      await jwtVerify(token, secret);

    const userId =
      payload.userId as string;

    // ==========================================
    // GET UPLOADED FILE
    // ==========================================

    const formData =
      await request.formData();

    const file =
      formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Resume file is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // ONLY PDF
    // ==========================================

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "Only PDF files are allowed",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // MAXIMUM 5 MB
    // ==========================================

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "Resume must be smaller than 5MB",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // CONVERT PDF TO BUFFER
    // ==========================================

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    // ==========================================
    // EXTRACT TEXT
    // ==========================================

    const parser =
      new PDFParse({
        data: buffer,
      });

    const result =
      await parser.getText();

    await parser.destroy();

    // ==========================================
    // CLEAN PDF EXTRACTION ARTIFACTS
    // ==========================================

    const extractedText =
      result.text

        // Remove pagination artifacts:
        // -- 1 of 2 --
        // -- 2 of 2 --
        // -- 10 of 15 --
        .replace(
          /--\s*\d+\s+of\s+\d+\s*--/gi,
          ""
        )

        // Remove excessive blank lines
        .replace(
          /\n{3,}/g,
          "\n\n"
        )

        // Remove leading/trailing whitespace
        .trim();

    // ==========================================
    // CHECK EXTRACTED TEXT
    // ==========================================

    if (!extractedText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // SAVE TO POSTGRESQL
    // ==========================================

    const resume =
      await prisma.resume.create({
        data: {
          userId,
          fileName: file.name,
          extractedText,
        },
      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        resume: {
          id: resume.id,
          fileName: resume.fileName,
          createdAt: resume.createdAt,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "Resume upload error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to upload resume",
      },
      {
        status: 500,
      }
    );
  }
}