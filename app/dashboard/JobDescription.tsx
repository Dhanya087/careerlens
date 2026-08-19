"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AnalysisResult = {
  analysis: {
    id: string;
    jobTitle: string | null;
    createdAt: string;
  };

  jobSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;

  resume: {
    id: string;
    fileName: string;
  };
};

export default function JobDescription() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeResume() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
        }),
      });

      const data: AnalysisResult & { error?: string } =
        await response.json();

      if (!response.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      // --------------------------------
      // Redirect to individual analysis
      // --------------------------------

      router.push(`/analysis/${data.analysis.id}`);

    } catch (error) {
      console.error("Analyze error:", error);

      setError(
        "Something went wrong while analyzing the resume."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 w-full max-w-2xl">

      {/* =====================================================
          JOB DESCRIPTION FORM
      ====================================================== */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        {/* Heading */}

        <div>
          <h2 className="text-2xl font-semibold text-white">
            Analyze a Job
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter a job title and paste the job description
            to compare it with your uploaded resume.
          </p>
        </div>


        {/* =================================================
            JOB TITLE
        ================================================== */}

        <label
          htmlFor="job-title"
          className="mt-6 block text-sm font-medium text-slate-300"
        >
          Job Title
        </label>

        <input
          id="job-title"
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Python Full Stack Developer"
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />


        {/* =================================================
            JOB DESCRIPTION
        ================================================== */}

        <label
          htmlFor="job-description"
          className="mt-5 block text-sm font-medium text-slate-300"
        >
          Job Description
        </label>

        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the complete job description here..."
          rows={10}
          disabled={loading}
          className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />


        {/* =================================================
            CHARACTER COUNT + BUTTON
        ================================================== */}

        <div className="mt-4 flex items-center justify-between gap-4">

          <span className="text-sm text-slate-500">
            {jobDescription.length} characters
          </span>

          <button
            type="button"
            onClick={analyzeResume}
            disabled={
              !jobTitle.trim() ||
              !jobDescription.trim() ||
              loading
            }
            className="rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Analyzing..."
              : "Analyze Resume →"}
          </button>

        </div>


        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

      </div>

    </div>
  );
}