import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import AISuggestions from "@/app/dashboard/AISuggestions";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AnalysisPage({
  params,
}: PageProps) {
  // ==========================================
  // 1. GET ANALYSIS ID
  // ==========================================

  const { id } = await params;

  // ==========================================
  // 2. CHECK AUTHENTICATION
  // ==========================================

  const cookieStore = await cookies();

  const token =
    cookieStore.get("auth_token")?.value;

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <h1 className="text-xl font-semibold text-red-400">
              Unauthorized
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Please log in to view this analysis.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-600"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // 3. VERIFY JWT
  // ==========================================

  let userId: string;

  try {
    const { payload } =
      await jwtVerify(token, secret);

    userId = payload.userId as string;

    if (!userId) {
      throw new Error("Invalid user ID");
    }
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return (
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <h1 className="text-xl font-semibold text-red-400">
              Authentication failed
            </h1>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-600"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // 4. GET ANALYSIS
  // ==========================================

  const analysis =
    await prisma.analysis.findFirst({
      where: {
        id,
        userId,
      },

      include: {
        resume: {
          select: {
            id: true,
            fileName: true,
          },
        },
      },
    });

  // ==========================================
  // 5. ANALYSIS NOT FOUND
  // ==========================================

  if (!analysis) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <h1 className="mt-4 text-2xl font-bold">
              Analysis Not Found
            </h1>

            <p className="mt-2 text-slate-400">
              This analysis may have been deleted
              or does not belong to your account.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600"
            >
              ← Back to Dashboard
            </Link>

          </div>

        </div>
      </main>
    );
  }

  // ==========================================
  // 6. CALCULATE COUNTS
  // ==========================================

  const matchedCount =
    analysis.matchedSkills.length;

  const requiredCount =
    analysis.jobSkills.length;

  // ==========================================
  // 7. PAGE UI
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">

      <div className="mx-auto w-full max-w-3xl">

        {/* ======================================
            TOP NAVIGATION
        ======================================= */}

        <div className="mb-6 flex items-center justify-between">

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Analyze Another Job
          </Link>

        </div>

        {/* ======================================
            HEADER
        ======================================= */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <p className="text-sm text-slate-400">
            Resume Analysis
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            {analysis.jobTitle ||
              "Job Analysis"}
          </h1>

          <div className="mt-4 space-y-1">

            <p className="text-sm text-slate-400">
              📄 Resume:{" "}
              <span className="text-slate-300">
                {analysis.resume.fileName}
              </span>
            </p>

            <p className="text-xs text-slate-500">
              Analyzed{" "}
              {new Date(
                analysis.createdAt
              ).toLocaleString()}
            </p>

          </div>

        </div>

        {/* ======================================
            MATCH SCORE
        ======================================= */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">

          <p className="text-sm text-slate-400">
            Resume Match
          </p>

          <div className="mt-2 text-6xl font-bold text-blue-400">
            {analysis.matchPercentage}%
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Based on detected skills and
            job requirements
          </p>

          {requiredCount > 0 && (
            <p className="mt-4 text-sm text-slate-500">
              {matchedCount} of{" "}
              {requiredCount} required skills
              matched
            </p>
          )}

        </div>

        {/* ======================================
            JOB DESCRIPTION
        ======================================= */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            📋 Job Description
          </h2>

          <div className="mt-4 rounded-xl bg-slate-950 p-5">

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {analysis.jobDescription}
            </p>

          </div>

        </div>

        {/* ======================================
            REQUIRED SKILLS
        ======================================= */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            🎯 Required Skills
          </h2>

          {analysis.jobSkills.length > 0 ? (

            <div className="mt-4 flex flex-wrap gap-2">

              {analysis.jobSkills.map(
                (skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400"
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          ) : (

            <p className="mt-3 text-slate-400">
              No specific skills detected.
            </p>

          )}

        </div>

        {/* ======================================
            MATCHED SKILLS
        ======================================= */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            ✅ Matched Skills
          </h2>

          {analysis.matchedSkills.length > 0 ? (

            <div className="mt-4 flex flex-wrap gap-2">

              {analysis.matchedSkills.map(
                (skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400"
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          ) : (

            <p className="mt-3 text-slate-400">
              No matching skills detected.
            </p>

          )}

        </div>

        {/* ======================================
            MISSING SKILLS
        ======================================= */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            ⚠️ Missing Skills
          </h2>

          {analysis.missingSkills.length > 0 ? (

            <div className="mt-4 flex flex-wrap gap-2">

              {analysis.missingSkills.map(
                (skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          ) : (

            <p className="mt-3 text-green-400">
              🎉 No missing skills detected!
            </p>

          )}

        </div>

        {/* ======================================
            AI SUGGESTIONS
        ======================================= */}

        <div className="mt-5">

          <AISuggestions
            analysisId={analysis.id}
          />

        </div>

        {/* ======================================
            BOTTOM NAVIGATION
        ======================================= */}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">

          <Link
            href="/dashboard"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-center font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          <Link
            href="/dashboard"
            className="flex-1 rounded-xl bg-blue-500 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-600"
          >
            Analyze Another Job →
          </Link>

        </div>

      </div>

    </main>
  );
}