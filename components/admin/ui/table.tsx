import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/** Scrolls sideways on small screens instead of squeezing columns. */
export function Table({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="overflow-x-auto">
      <table aria-label={label} className="min-w-full text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={`whitespace-nowrap px-4 py-3 font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 text-slate-700">{children}</tbody>;
}

export function Td({ children, className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

/** Keeps number columns aligned. */
export const numericCell = "text-right tabular-nums whitespace-nowrap";
