"use client";

import { useState } from "react";

type Props = {
  analysisId: string;
};

export default function AISuggestions({ analysisId }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getSuggestions() {
    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate suggestions");
        return;
      }

      setSuggestions(data.suggestions);
    } catch (error) {
      console.error(error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            ✨ AI Resume Suggestions
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Get practical suggestions to improve your resume.
          </p>
        </div>

        <button
          onClick={getSuggestions}
          disabled={loading}
          className="rounded-xl bg-purple-500 px-5 py-3 font-semibold text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Generating..." : "Get Suggestions"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6 space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-700 bg-slate-950 p-4"
            >
              <div className="flex gap-3">
                <span className="font-bold text-purple-400">
                  {index + 1}.
                </span>

                <p className="text-slate-300">
                  {suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}