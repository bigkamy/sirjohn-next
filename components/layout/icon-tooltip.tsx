import type { ReactNode } from "react";

/**
 * Shows the name of an icon-only control on hover, and on keyboard focus too.
 *
 * Purely decorative: the control it wraps already carries an aria-label, so the bubble is
 * aria-hidden to keep screen readers from announcing the same name twice. No JavaScript and
 * no state, so it works in server and client components alike.
 */
export function IconTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-[#0f172a] px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
