import Link from "next/link";
import { Search } from "lucide-react";
import { buttonClass, inputClass } from "./styles";

export type FilterSelect = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

/**
 * Search and filters as a plain GET form: results are filtered on the server, the URL can be
 * shared, and it works before any JavaScript loads.
 */
export function FilterBar({
  action,
  search,
  selects = [],
  hidden = {},
}: {
  action: string;
  search?: { value: string; placeholder: string; label?: string };
  selects?: FilterSelect[];
  hidden?: Record<string, string>;
}) {
  const active = Boolean(search?.value) || selects.some((select) => select.value !== "");

  return (
    <form action={action} method="get" role="search" className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-end">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {search && (
        <div className="relative min-w-0 flex-1">
          <label htmlFor={`${action}-q`} className="sr-only">{search.label ?? "Search"}</label>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input id={`${action}-q`} type="search" name="q" defaultValue={search.value} placeholder={search.placeholder} className={`${inputClass} pl-10`} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
        {selects.map((select) => (
          <div key={select.name} className="lg:w-44">
            <label htmlFor={`${action}-${select.name}`} className="mb-1 block text-xs font-medium text-slate-500">{select.label}</label>
            <select id={`${action}-${select.name}`} name={select.name} defaultValue={select.value} className={inputClass}>
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" className={buttonClass("primary")}>Apply</button>
        {active && (
          <Link href={action} className={buttonClass("ghost")}>
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}

/** Previous/next links that keep the current filters. */
export function Pagination({
  action,
  page,
  pageSize,
  total,
  params,
}: {
  action: string;
  page: number;
  pageSize: number;
  total: number;
  params: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const href = (target: number) => {
    const query = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, value]) => value)), page: String(target) });
    return `${action}?${query}`;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <p>
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={buttonClass("secondary", "sm")}>Previous</Link>
        ) : (
          <span aria-disabled className={`${buttonClass("secondary", "sm")} pointer-events-none opacity-50`}>Previous</span>
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className={buttonClass("secondary", "sm")}>Next</Link>
        ) : (
          <span aria-disabled className={`${buttonClass("secondary", "sm")} pointer-events-none opacity-50`}>Next</span>
        )}
      </div>
    </nav>
  );
}

/** Reads ?page=, clamped to 1 or more. */
export function pageParam(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** Reads a single string search param. */
export function textParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}
