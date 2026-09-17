"use client";

import "./globals.css";
import { siteConfig } from "@/lib/site-config";

// Replaces the root layout when it fails, so it renders its own document.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#faf8f4] text-slate-900">
        <title>{`Something went wrong | ${siteConfig.name}`}</title>
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Something went wrong</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">We couldn’t load the store</h1>
            <p className="mt-4 text-lg text-slate-600">This is usually temporary. Please try again in a moment.</p>
            {error.digest && <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>}
            <button type="button" onClick={() => retry()} className="mt-8 rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white">
              Try Again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
