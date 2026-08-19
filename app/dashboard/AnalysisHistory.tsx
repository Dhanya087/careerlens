"use client";

import { useEffect, useState } from "react";

type Analysis = {
  id: string;
  resumeId: string;
  jobTitle: string | null;
  jobSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  createdAt: string;
  resume: {
    fileName: string;
  };
};

export default function AnalysisHistory() {
  const [analyses, setAnalyses] =
    useState<Analysis[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // ==========================================
  // LOAD HISTORY
  // ==========================================

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(
          "/api/analyze/history"
        );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "Failed to load history"
          );
          return;
        }

        setAnalyses(
          data.analyses || []
        );

      } catch (error) {
        console.error(
          "Load history error:",
          error
        );

        setError(
          "Something went wrong while loading history."
        );

      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  // ==========================================
  // DELETE ANALYSIS
  // ==========================================

  async function deleteAnalysis(
    analysisId: string,
    jobTitle: string | null
  ) {
    const confirmed =
      window.confirm(
        `Delete this analysis${
          jobTitle
            ? ` for "${jobTitle}"`
            : ""
        }?\n\nThis will remove it from your Analysis History.`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(analysisId);

    try {
      const response =
        await fetch(
          `/api/analyze/${analysisId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to delete analysis"
        );
        return;
      }

      // Remove card immediately
      setAnalyses((current) =>
        current.filter(
          (analysis) =>
            analysis.id !== analysisId
        )
      );

    } catch (error) {
      console.error(
        "Delete analysis error:",
        error
      );

      setError(
        "Something went wrong while deleting the analysis."
      );

    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="mt-10 w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
          Loading analysis history...
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mt-10 w-full max-w-2xl">

      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          Analysis History
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          View and manage your previous
          resume analyses.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty */}

      {analyses.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">

          <div className="text-4xl">
            📊
          </div>

          <p className="mt-3 text-slate-400">
            No analyses yet.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Analyze a job to see your results
            here.
          </p>

        </div>
      ) : (

        <div className="space-y-4">

          {analyses.map((analysis) => {

            const isDeleting =
              deletingId === analysis.id;

            return (
              <div
                key={analysis.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
              >

                {/* HEADER */}

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <h3 className="text-lg font-semibold text-white">
                      {analysis.jobTitle ||
                        "Resume Analysis"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      📄{" "}
                      {analysis.resume.fileName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(
                        analysis.createdAt
                      ).toLocaleString()}
                    </p>

                  </div>

                  {/* MATCH */}

                  <div className="shrink-0 text-right">

                    <div className="text-3xl font-bold text-blue-400">
                      {analysis.matchPercentage}%
                    </div>

                    <p className="text-xs text-slate-500">
                      Match
                    </p>

                  </div>

                </div>

                {/* MATCHED SKILLS */}

                {analysis.matchedSkills.length >
                  0 && (

                  <div className="mt-5">

                    <p className="mb-2 text-sm font-medium text-slate-300">
                      ✅ Matched Skills
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {analysis.matchedSkills.map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-400"
                          >
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                  </div>

                )}

                {/* MISSING SKILLS */}

                {analysis.missingSkills.length >
                  0 && (

                  <div className="mt-4">

                    <p className="mb-2 text-sm font-medium text-slate-300">
                      ⚠️ Missing Skills
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {analysis.missingSkills.map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-400"
                          >
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                  </div>

                )}

                {/* SUMMARY */}

                {analysis.jobSkills.length >
                  0 && (

                  <div className="mt-5 border-t border-slate-800 pt-4">

                    <p className="text-xs text-slate-500">
                      {
                        analysis.matchedSkills
                          .length
                      }{" "}
                      of{" "}
                      {
                        analysis.jobSkills
                          .length
                      }{" "}
                      required skills
                      matched
                    </p>

                  </div>

                )}

                {/* ACTIONS */}

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">

                  {/* VIEW */}

                  <a
                    href={`/analysis/${analysis.id}`}
                    className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    View Full Analysis →
                  </a>

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() =>
                      deleteAnalysis(
                        analysis.id,
                        analysis.jobTitle
                      )
                    }
                    disabled={isDeleting}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting
                      ? "Deleting..."
                      : "🗑 Delete"}
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}