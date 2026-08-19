import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ResumeUpload from "./ResumeUpload";
import ResumeList from "./ResumeList";
import JobDescription from "./JobDescription";
import AnalysisHistory from "./AnalysisHistory";
import LogoutButton from "./LogoutButton";
import DashboardNav from "./DashboardNav";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export default async function DashboardPage() {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      redirect("/login");
    }

    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId as string;

    const userName =
      typeof payload.name === "string"
        ? payload.name
        : "User";


    // ==========================================
    // DASHBOARD STATISTICS
    // ==========================================

    const [
      resumeCount,
      analysisCount,
      averageResult,
      bestResult,
    ] = await Promise.all([
      // Total resumes
      prisma.resume.count({
        where: {
          userId,
        },
      }),

      // Total analyses
      prisma.analysis.count({
        where: {
          userId,
        },
      }),

      // Average match percentage
      prisma.analysis.aggregate({
        where: {
          userId,
        },

        _avg: {
          matchPercentage: true,
        },
      }),

      // Highest match percentage
      prisma.analysis.aggregate({
        where: {
          userId,
        },

        _max: {
          matchPercentage: true,
        },
      }),
    ]);


    const averageMatch = Math.round(
      averageResult._avg.matchPercentage ?? 0
    );

    const bestMatch =
      bestResult._max.matchPercentage ?? 0;


    // ==========================================
    // PAGE
    // ==========================================

    return (
      <main className="min-h-screen bg-slate-950 text-white">

        {/* ======================================
            HEADER
        ======================================= */}

        <header className="border-b border-slate-800 bg-slate-950/95">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

            <div>
              <h1 className="text-xl font-bold">
                Career
                <span className="text-blue-400">
                  Lens
                </span>
              </h1>

              <p className="text-xs text-slate-500">
                AI-powered resume analysis
              </p>
            </div>

            <LogoutButton />

          </div>

        </header>


        {/* ======================================
            MAIN
        ======================================= */}

        <div className="mx-auto max-w-7xl px-6 py-10">


          {/* ====================================
              WELCOME
          ===================================== */}

          <section className="mb-8">

            <p className="text-sm font-medium text-blue-400">
              Dashboard
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Welcome back, {userName} 👋
            </h2>

            <p className="mt-2 max-w-2xl text-slate-400">
              Analyze your resume, compare it with jobs,
              and identify the skills you need to improve.
            </p>

          </section>


          {/* ====================================
              NAVIGATION
          ===================================== */}

          <DashboardNav
            children={{

              /* ==================================
                 OVERVIEW
              =================================== */

              overview: (
                <div className="space-y-8">


                  {/* =================================
                      STATISTICS
                  ================================== */}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


                    {/* RESUMES */}

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">

                      <p className="text-sm text-slate-400">
                        📄 Resumes
                      </p>

                      <p className="mt-2 text-3xl font-bold text-white">
                        {resumeCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Uploaded resumes
                      </p>

                    </div>


                    {/* ANALYSES */}

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">

                      <p className="text-sm text-slate-400">
                        📊 Analyses
                      </p>

                      <p className="mt-2 text-3xl font-bold text-white">
                        {analysisCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Job analyses
                      </p>

                    </div>


                    {/* AVERAGE MATCH */}

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">

                      <p className="text-sm text-slate-400">
                        🎯 Match Score
                      </p>

                      <p className="mt-2 text-3xl font-bold text-blue-400">
                        {analysisCount > 0
                          ? `${averageMatch}%`
                          : "—"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Average match
                      </p>

                    </div>


                    {/* BEST MATCH */}

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">

                      <p className="text-sm text-slate-400">
                        🏆 Best Match
                      </p>

                      <p className="mt-2 text-3xl font-bold text-green-400">
                        {analysisCount > 0
                          ? `${bestMatch}%`
                          : "—"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Highest score
                      </p>

                    </div>

                  </div>


                  {/* =================================
                      NEW JOB ANALYSIS
                  ================================== */}

                  <section>

                    <div className="mb-5">

                      <h3 className="text-2xl font-bold">
                        Analyze a Job
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Compare your latest resume with a
                        specific job description.
                      </p>

                    </div>


                    <div className="flex justify-center">

                      <JobDescription />

                    </div>

                  </section>

                </div>
              ),


              /* ==================================
                 MY RESUMES
              =================================== */

              resumes: (
                <div className="mx-auto max-w-4xl space-y-10">


                  {/* UPLOAD */}

                  <section>

                    <div className="mb-5">

                      <h3 className="text-2xl font-bold">
                        Upload Resume
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Upload a PDF resume to use for
                        job analysis.
                      </p>

                    </div>

                    <div className="flex justify-center">

                      <ResumeUpload />

                    </div>

                  </section>


                  {/* DIVIDER */}

                  <div className="border-t border-slate-800" />


                  {/* RESUME LIST */}

                  <section>

                    <div className="mb-5">

                      <h3 className="text-2xl font-bold">
                        My Resumes
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Manage your uploaded resumes.
                      </p>

                    </div>

                    <div className="flex justify-center">

                      <ResumeList />

                    </div>

                  </section>

                </div>
              ),


              /* ==================================
                 ANALYSIS HISTORY
              =================================== */

              history: (
                <div className="mx-auto max-w-4xl">

                  <div className="mb-5">

                    <h3 className="text-2xl font-bold">
                      Analysis History
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      View and manage your previous job
                      analyses.
                    </p>

                  </div>

                  <div className="flex justify-center">

                    <AnalysisHistory />

                  </div>

                </div>
              ),

            }}
          />

        </div>

      </main>
    );

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    redirect("/login");
  }
}