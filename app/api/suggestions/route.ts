import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    "GEMINI_API_KEY is not configured"
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

// ======================================================
// GEMINI MODELS
// ======================================================

const MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
];

// ======================================================
// SMALL DELAY
// ======================================================

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ======================================================
// CHECK TEMPORARY GEMINI ERRORS
// ======================================================

function isTemporaryError(error: any) {
  const status =
    error?.status ??
    error?.code ??
    error?.response?.status;

  return (
    status === 429 ||
    status === 500 ||
    status === 503
  );
}

// ======================================================
// GET ERROR STATUS
// ======================================================

function getErrorStatus(error: any) {
  return (
    error?.status ??
    error?.code ??
    error?.response?.status ??
    500
  );
}

// ======================================================
// GENERATE AI RESPONSE
// ======================================================

async function generateWithRetry(
  prompt: string
): Promise<string> {
  let lastError: unknown = null;

  for (const model of MODELS) {
    // Only TWO attempts per model
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(
          `Gemini request: ${model}, attempt ${
            attempt + 1
          }`
        );

        const response =
          await ai.models.generateContent({
            model,
            contents: prompt,
          });

        const text = response.text?.trim();

        if (!text) {
          throw new Error(
            "Gemini returned an empty response"
          );
        }

        console.log(
          `Gemini success: ${model}`
        );

        return text;

      } catch (error: any) {
        lastError = error;

        const status =
          getErrorStatus(error);

        console.error(
          `Gemini failed: ${model}, attempt ${
            attempt + 1
          }, status ${status}`,
          error
        );

        // Don't retry non-temporary errors
        if (!isTemporaryError(error)) {
          throw error;
        }

        // Don't wait after the final attempt
        if (attempt === 1) {
          break;
        }

        // Short retry delay
        // 1 second for first retry
        const delay =
          1000 * Math.pow(2, attempt);

        console.log(
          `Retrying Gemini in ${delay}ms...`
        );

        await sleep(delay);
      }
    }

    console.log(
      `Trying fallback Gemini model: ${model}`
    );
  }

  throw lastError;
}

// ======================================================
// POST
// ======================================================

export async function POST(
  request: Request
) {
  try {
    // ==================================================
    // 1. CHECK API KEY
    // ==================================================

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured on the server.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 2. AUTHENTICATION
    // ==================================================

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

    let userId: string;

    try {
      const { payload } =
        await jwtVerify(token, secret);

      userId =
        typeof payload.userId === "string"
          ? payload.userId
          : "";

    } catch (error) {
      console.error(
        "JWT verification failed:",
        error
      );

      return NextResponse.json(
        {
          error: "Invalid authentication token",
        },
        {
          status: 401,
        }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Invalid authentication token",
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 3. READ REQUEST
    // ==================================================

    const body = await request.json();

    const analysisId =
      typeof body.analysisId === "string"
        ? body.analysisId.trim()
        : "";

    if (!analysisId) {
      return NextResponse.json(
        {
          error:
            "Analysis ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 4. GET ANALYSIS
    // ==================================================

    const analysis =
      await prisma.analysis.findFirst({
        where: {
          id: analysisId,
          userId,
        },

        include: {
          resume: true,
        },
      });

    if (!analysis) {
      return NextResponse.json(
        {
          error:
            "Analysis not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 5. CREATE PROMPT
    // ==================================================

    const prompt = `
You are an expert ATS resume analyzer
and professional resume coach.

Analyze the candidate's resume against
the specific job.

JOB TITLE:
${analysis.jobTitle || "Not provided"}

JOB DESCRIPTION:
${analysis.jobDescription}

REQUIRED JOB SKILLS:
${
  analysis.jobSkills.length > 0
    ? analysis.jobSkills.join(", ")
    : "None detected"
}

MATCHED SKILLS:
${
  analysis.matchedSkills.length > 0
    ? analysis.matchedSkills.join(", ")
    : "None"
}

MISSING SKILLS:
${
  analysis.missingSkills.length > 0
    ? analysis.missingSkills.join(", ")
    : "None"
}

RESUME:
${analysis.resume.extractedText}

Generate exactly 5 practical,
specific, evidence-based suggestions
for improving this resume for THIS job.

IMPORTANT RULES:

1. Base every suggestion on the actual
   resume and job description.

2. Do NOT invent skills, technologies,
   experience, projects, certifications,
   achievements, metrics, or qualifications.

3. Do NOT tell the candidate to claim
   a skill they do not have.

4. If a skill is missing, recommend
   learning it or gaining experience
   with it. Do not recommend falsely
   adding it to the resume.

5. Do NOT recommend changing a technology
   name simply to manipulate ATS.

For example, do NOT recommend changing
"HTML" to "HTML5" or "CSS" to "CSS3"
unless the job specifically requires
those terms AND the candidate genuinely
has that experience.

6. Only recommend ATS keyword improvements
   when supported by the job and resume.

7. If the resume contains PDF extraction
   artifacts such as page numbers,
   duplicated text, broken words, or
   "-- 1 of 2 --", mention them only if
   they could realistically affect ATS
   parsing.

8. Prioritize:

   - Missing important skills
   - Professional summary
   - Relevant projects
   - Technical skills organization
   - Quantifiable achievements
   - ATS readability
   - Job-specific keywords

9. Do not give generic advice.

Bad:
"Improve your resume."

Good:
"Move your Django and PostgreSQL
experience into the Technical Skills
section because both technologies are
explicit requirements for this role."

10. Do not recommend removing a technology
    just because another technology is
    also present.

11. Do not assume every missing skill is
    equally important.

12. Suggestions must be specific to THIS
    candidate and THIS job.

Return exactly 5 suggestions.

Return JSON only in this format:

[
  "Suggestion 1",
  "Suggestion 2",
  "Suggestion 3",
  "Suggestion 4",
  "Suggestion 5"
]
`;

    // ==================================================
    // 6. CALL GEMINI
    // ==================================================

    const text =
      await generateWithRetry(prompt);

    // ==================================================
    // 7. PARSE RESPONSE
    // ==================================================

    let suggestions: string[] = [];

    try {
      let cleanedText = text.trim();

      // Remove markdown code fences if Gemini
      // happens to return them.

      if (
        cleanedText.startsWith("```json")
      ) {
        cleanedText =
          cleanedText
            .replace(/^```json\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
      } else if (
        cleanedText.startsWith("```")
      ) {
        cleanedText =
          cleanedText
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
      }

      const parsed =
        JSON.parse(cleanedText);

      if (Array.isArray(parsed)) {
        suggestions = parsed
          .filter(
            (item) =>
              typeof item === "string"
          )
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);
      }

    } catch (error) {
      console.error(
        "Gemini JSON parsing failed:",
        error
      );

      console.error(
        "Raw Gemini response:",
        text
      );

      return NextResponse.json(
        {
          error:
            "AI returned an invalid response. Please try again.",
        },
        {
          status: 502,
        }
      );
    }

    // ==================================================
    // 8. VALIDATE SUGGESTIONS
    // ==================================================

    if (suggestions.length === 0) {
      return NextResponse.json(
        {
          error:
            "AI did not generate any suggestions. Please try again.",
        },
        {
          status: 502,
        }
      );
    }

    // Keep maximum 5
    suggestions =
      suggestions.slice(0, 5);

    // ==================================================
    // 9. RETURN
    // ==================================================

    return NextResponse.json({
      success: true,
      suggestions,
    });

  } catch (error: any) {
    console.error(
      "AI suggestions error:",
      error
    );

    const status =
      getErrorStatus(error);

    // ==================================================
    // RATE LIMIT
    // ==================================================

    if (status === 429) {
      return NextResponse.json(
        {
          error:
            "Gemini rate limit reached. Please wait a moment and try again.",
        },
        {
          status: 429,
        }
      );
    }

    // ==================================================
    // SERVICE UNAVAILABLE
    // ==================================================

    if (status === 503) {
      return NextResponse.json(
        {
          error:
            "Gemini is temporarily busy. Please try again in a few seconds.",
        },
        {
          status: 503,
        }
      );
    }

    // ==================================================
    // SERVER ERROR
    // ==================================================

    if (status === 500) {
      return NextResponse.json(
        {
          error:
            "Gemini is currently unavailable. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // DEFAULT
    // ==================================================

    return NextResponse.json(
      {
        error:
          "Failed to generate AI suggestions.",
      },
      {
        status: 500,
      }
    );
  }
}