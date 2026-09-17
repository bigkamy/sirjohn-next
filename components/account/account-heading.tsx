import type { ReactNode } from "react";

/** Title card at the top of each account page, with optional actions on the right. */
export function AccountHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{title}</h1>
      </div>
      {children}
    </div>
  );
}
