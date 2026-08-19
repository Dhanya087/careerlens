import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // ==========================================
    // 1. AUTHENTICATION
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

    const { payload } =
      await jwtVerify(token, secret);

    const userId =
      payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        {
          error: "Invalid user",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // 2. GET REQUEST BODY
    // ==========================================

    const body = await request.json();

    const jobTitle =
      typeof body.jobTitle === "string"
        ? body.jobTitle.trim()
        : "";

    const jobDescription =
      typeof body.jobDescription === "string"
        ? body.jobDescription.trim()
        : "";

    if (!jobTitle) {
      return NextResponse.json(
        {
          error: "Job title is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        {
          error: "Job description is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 3. GET LATEST RESUME
    // ==========================================

    const resume =
      await prisma.resume.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (!resume) {
      return NextResponse.json(
        {
          error: "Please upload a resume first",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 4. CREATE GEMINI PROMPT
    // ==========================================

    const prompt = `
You are an expert ATS resume analyzer.

Compare the following resume with the job description.

JOB TITLE:
${jobTitle}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume.extractedText}

Your task:

1. Extract the important technical and professional skills required by the job.
2. Determine which of those skills are clearly present in the resume.
3. Determine which required skills are missing from the resume.
4. Normalize equivalent technology names when appropriate.

Examples:

- "JS" and "JavaScript" can be treated as the same skill.
- "Postgres" and "PostgreSQL" can be treated as the same skill.
- ".NET" should remain ".NET".
- "MS Word" and "Microsoft Word" can be treated as the same skill.

Important rules:

- Only include skills that are actually supported by the job description.
- Do not invent job requirements.
- Do not invent resume skills.
- Do not treat unrelated words as technical skills.
- Do not assume a skill is present unless the resume provides evidence.
- Keep skill names concise.
- Avoid duplicate skills.
- Return the normalized skill names.
- If a skill appears in the job description but is not supported by the resume, put it in missingSkills.

Return only JSON using exactly this structure:

{
  "jobSkills": [],
  "matchedSkills": [],
  "missingSkills": []
}
`;

    // ==========================================
    // 5. CALL GEMINI
    // ==========================================

    const response =
      await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: "object",

            properties: {
              jobSkills: {
                type: "array",
                items: {
                  type: "string",
                },
              },

              matchedSkills: {
                type: "array",
                items: {
                  type: "string",
                },
              },

              missingSkills: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },

            required: [
              "jobSkills",
              "matchedSkills",
              "missingSkills",
            ],
          },
        },
      });

    // ==========================================
    // 6. READ GEMINI RESPONSE
    // ==========================================

    const text = response.text;

    if (!text) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    const aiResult = JSON.parse(text);

    const jobSkills: string[] =
      Array.isArray(aiResult.jobSkills)
        ? aiResult.jobSkills
        : [];

    const matchedSkills: string[] =
      Array.isArray(aiResult.matchedSkills)
        ? aiResult.matchedSkills
        : [];

    const missingSkills: string[] =
      Array.isArray(aiResult.missingSkills)
        ? aiResult.missingSkills
        : [];

    // ==========================================
    // 7. CALCULATE MATCH PERCENTAGE
    // ==========================================

    const matchPercentage =
      jobSkills.length > 0
        ? Math.round(
            (matchedSkills.length /
              jobSkills.length) *
              100
          )
        : 0;

    // ==========================================
    // 8. SAVE ANALYSIS
    // ==========================================

    const analysis =
      await prisma.analysis.create({
        data: {
          userId,
          resumeId: resume.id,
          jobTitle,
          jobDescription,
          jobSkills,
          matchedSkills,
          missingSkills,
          matchPercentage,
        },
      });

    // ==========================================
    // 9. RETURN RESULT
    // ==========================================

    return NextResponse.json({
      success: true,

      analysis: {
        id: analysis.id,
        jobTitle: analysis.jobTitle,
        createdAt: analysis.createdAt,
      },

      resume: {
        id: resume.id,
        fileName: resume.fileName,
      },

      jobSkills,
      matchedSkills,
      missingSkills,
      matchPercentage,
    });

  } catch (error) {
    console.error(
      "AI Analyze error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to analyze resume with AI",
      },
      {
        status: 500,
      }
    );
  }
}