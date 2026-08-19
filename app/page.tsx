import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-slate-800 px-8 py-5">
        <h1 className="text-2xl font-bold">CareerLens</h1>

        <div className="flex gap-4">
  <Link
    href="/login"
    className="rounded-lg px-4 py-2 text-slate-300 hover:text-white"
  >
    Login
  </Link>

  <Link
    href="/signup"
    className="rounded-lg bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-200"
  >
    Sign Up
  </Link>
</div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
          AI-Powered Career Assistant
        </div>

        <h2 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl">
          Make your resume
          <span className="text-blue-400"> job-ready.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Upload your resume and compare it with a job description.
          CareerLens identifies skill gaps and helps improve your resume.
        </p>

        <Link
          href="/signup"
          className="mt-10 rounded-xl bg-blue-500 px-7 py-3 font-semibold text-white hover:bg-blue-600"
        >
          Analyze My Resume →
        </Link>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 text-3xl">📄</div>
          <h3 className="text-xl font-semibold">Resume Analysis</h3>
          <p className="mt-2 text-slate-400">
            Extract and analyze important information from your resume.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 text-3xl">🎯</div>
          <h3 className="text-xl font-semibold">Job Matching</h3>
          <p className="mt-2 text-slate-400">
            Compare your skills and experience with a specific job.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 text-3xl">✨</div>
          <h3 className="text-xl font-semibold">AI Suggestions</h3>
          <p className="mt-2 text-slate-400">
            Get practical suggestions to improve your resume.
          </p>
        </div>
      </section>
    </main>
  );
}