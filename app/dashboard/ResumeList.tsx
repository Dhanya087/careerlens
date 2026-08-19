"use client";

import { useEffect, useState } from "react";

type Resume = {
  id: string;
  fileName: string;
  extractedText: string;
  createdAt: string;
};

export default function ResumeList() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD RESUMES
  // ==========================================

  useEffect(() => {
    async function loadResumes() {
      try {
        setError("");

        const response = await fetch(
          "/api/resume/list"
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "Failed to load resumes"
          );
          return;
        }

        if (data.success) {
          setResumes(data.resumes || []);
        }
      } catch (error) {
        console.error(
          "Failed to load resumes:",
          error
        );

        setError(
          "Failed to load resumes"
        );
      } finally {
        setLoading(false);
      }
    }

    loadResumes();
  }, []);

  // ==========================================
  // DELETE RESUME
  // ==========================================

  async function deleteResume(
    resumeId: string,
    fileName: string
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"?\n\nThis will also delete all analyses associated with this resume.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(resumeId);

    try {
      const response = await fetch(
        `/api/resume/${resumeId}`,
        {
          method: "DELETE",
        }
      );

      // Read response as text first.
      // This prevents JSON.parse errors if
      // the server accidentally returns HTML.
      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error(
          "Server returned non-JSON response:",
          responseText
        );

        throw new Error(
          `Delete request failed with status ${response.status}`
        );
      }

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to delete resume"
        );
        return;
      }

      // ========================================
      // REMOVE FROM UI
      // ========================================

      setResumes((currentResumes) =>
        currentResumes.filter(
          (resume) =>
            resume.id !== resumeId
        )
      );

    } catch (error) {
      console.error(
        "Delete resume error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the resume."
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
      <div className="mt-8 w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <p className="text-slate-400">
            Loading resumes...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY
  // ==========================================

  if (resumes.length === 0) {
    return (
      <div className="mt-8 w-full max-w-2xl">

        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-white">
            Your Resumes
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">

          <div className="text-4xl">
            📄
          </div>

          <p className="mt-3 text-slate-300">
            No resumes uploaded yet.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Upload your resume to start
            analyzing jobs.
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // RESUME LIST
  // ==========================================

  return (
    <div className="mt-8 w-full max-w-2xl">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="mb-5">

        <h2 className="text-2xl font-semibold text-white">
          Your Resumes
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {resumes.length}{" "}
          {resumes.length === 1
            ? "resume"
            : "resumes"}{" "}
          uploaded
        </p>

      </div>

      {/* ======================================
          ERROR
      ======================================= */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">

          <p className="text-sm text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-xs text-red-400 hover:text-red-300"
          >
            ✕
          </button>

        </div>
      )}

      {/* ======================================
          CARDS
      ======================================= */}

      <div className="space-y-4">

        {resumes.map((resume) => {

          const isDeleting =
            deletingId === resume.id;

          return (
            <div
              key={resume.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
            >

              {/* ==================================
                  RESUME HEADER
              =================================== */}

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0 flex-1">

                  <h3 className="truncate font-semibold text-white">
                    📄 {resume.fileName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Uploaded{" "}
                    {new Date(
                      resume.createdAt
                    ).toLocaleString()}
                  </p>

                </div>

                {/* =================================
                    DELETE BUTTON
                ================================== */}

                <button
                  type="button"
                  onClick={() =>
                    deleteResume(
                      resume.id,
                      resume.fileName
                    )
                  }
                  disabled={isDeleting}
                  className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting
                    ? "Deleting..."
                    : "🗑 Delete"}
                </button>

              </div>

              {/* ==================================
                  EXTRACTED TEXT
              =================================== */}

              <details className="mt-4">

                <summary className="cursor-pointer select-none text-sm font-medium text-slate-400 transition hover:text-white">
                  ▶ View extracted text
                </summary>

                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">

                  <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {resume.extractedText}
                  </p>

                </div>

              </details>

            </div>
          );
        })}

      </div>
    </div>
  );
}