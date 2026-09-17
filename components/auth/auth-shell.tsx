import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  /** Optional hero photo shown beside the form on large screens. */
  image?: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, image, children }: AuthShellProps) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div
        className={`grid overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ${
          image ? "lg:grid-cols-2" : "mx-auto max-w-lg"
        }`}
      >
        {image && (
          <div
            className="hidden min-h-[560px] bg-cover bg-center lg:block"
            style={{
              backgroundImage: `linear-gradient(rgba(15,23,42,0.62),rgba(15,23,42,0.52)),url('${image}')`,
            }}
          />
        )}

        <div className="p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
