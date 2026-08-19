"use client";

import { FormEvent, useState } from "react";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!file) {
      setError("Please select a PDF resume.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setMessage(
        `Resume "${data.resume.fileName}" uploaded successfully!`
      );

      setFile(null);
    } catch (error) {
      console.error(error);
      setError("Something went wrong while uploading.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-semibold">
        Upload Your Resume
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Upload your resume as a PDF. Maximum size: 5MB.
      </p>

      <form onSubmit={handleUpload} className="mt-6">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
          }}
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm"
        />

        {file && (
          <p className="mt-3 text-sm text-slate-400">
            Selected: {file.name}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Resume"}
        </button>
      </form>
    </div>
  );
}