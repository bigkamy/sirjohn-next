"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { buttonClass } from "@/components/admin/ui/styles";

// Errors reach the browser without their message in production, so only a reference that
// matches the server logs is shown.
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <TriangleAlert size={28} className="mx-auto text-amber-500" aria-hidden />
      <h1 className="mt-3 text-xl font-bold text-slate-900">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-slate-600">This is usually temporary. Try again, or check System health if it keeps happening.</p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={() => retry()} className={buttonClass("primary")}>
          Try again
        </button>
        <Link href="/admin" className={buttonClass("secondary")}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
