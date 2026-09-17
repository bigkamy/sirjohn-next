import Link from "next/link";
import { buttonClass } from "@/components/admin/ui/styles";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Not found</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-sm text-slate-600">It may have been deleted, or the link is out of date.</p>
      <Link href="/admin" className={`${buttonClass("primary")} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}
