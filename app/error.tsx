"use client";

import Link from "next/link";

// Server errors reach the browser without their message in production, so nothing
// technical is shown here — only a reference that matches the server logs.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Something went wrong</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">We couldn’t load this page</h1>
        <p className="mt-4 text-lg text-slate-600">This is usually temporary. Please try again in a moment.</p>
        {error.digest && <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button type="button" onClick={() => retry()} className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white">
            Try Again
          </button>
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
