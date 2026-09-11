import Link from "next/link";
import type { ReactNode } from "react";

type AdminHeadingProps = {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  /** Action links shown on the right. */
  children?: ReactNode;
};

export function AdminHeading({ title, description, back, children }: AdminHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="text-sm font-medium text-emerald-700">
            ← {back.label}
          </Link>
        )}
        <p className={`${back ? "mt-4 " : ""}text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700`}>Admin panel</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{title}</h1>
        {description && <div className="mt-3 max-w-2xl text-sm text-slate-600">{description}</div>}
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

export const adminButtonClass = "rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700";
export const adminPrimaryButtonClass = "rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white";
