"use client";

import { useState } from "react";

type DashboardNavProps = {
  children: {
    overview: React.ReactNode;
    resumes: React.ReactNode;
    history: React.ReactNode;
  };
};

export default function DashboardNav({
  children,
}: DashboardNavProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
            activeTab === "overview"
              ? "bg-blue-500 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          📊 Overview
        </button>

        <button
          onClick={() => setActiveTab("resumes")}
          className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
            activeTab === "resumes"
              ? "bg-blue-500 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          📄 My Resumes
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
            activeTab === "history"
              ? "bg-blue-500 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          📈 Analysis History
        </button>
      </div>

      {/* Content */}
      {activeTab === "overview" && children.overview}

      {activeTab === "resumes" && children.resumes}

      {activeTab === "history" && children.history}
    </div>
  );
}