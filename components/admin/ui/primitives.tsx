import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cardClass } from "./styles";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-700">
            <ArrowLeft size={15} aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {description && <div className="mt-1.5 max-w-3xl text-sm text-slate-500">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${cardClass} ${className}`}>{children}</section>;
}

export function CardHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <div className="mt-0.5 text-sm text-slate-500">{description}</div>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  href,
  icon,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  href?: string;
  icon?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden>{icon}</span>}
      </div>
      <p className="mt-2 text-[26px] font-bold tracking-tight text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </>
  );

  return href ? (
    <Link href={href} className={`${cardClass} group block p-5 transition hover:border-emerald-300`}>
      {body}
      <span className="sr-only">View details</span>
    </Link>
  ) : (
    <div className={`${cardClass} p-5`}>{body}</div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500" aria-hidden>{icon}</div>}
      <p className="font-semibold text-slate-900">{title}</p>
      {description && <div className="mt-1 max-w-md text-sm text-slate-500">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning"; children: ReactNode }) {
  const styles = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900";
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <div role="note" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900">
      {children} <ArrowUpRight size={14} aria-hidden />
    </Link>
  );
}

/** A definition list for detail pages. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="min-w-0 break-words text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
