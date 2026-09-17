import Link from "next/link";

export type BarListItem = { key: string | number; name: string; href?: string; value: number; valueLabel: string };

// Same validated series colour as the trend charts. Every bar carries its value as a label.
const SERIES = "#875719";

/** Ranked horizontal bars, labelled with their values. */
export function BarList({ items }: { items: BarListItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ol className="space-y-4 p-5">
      {items.map((item, index) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-slate-800">
              <span className="mr-1.5 tabular-nums text-slate-400">{index + 1}.</span>
              {item.href ? (
                <Link href={item.href} className="hover:text-brand-700">
                  {item.name}
                </Link>
              ) : (
                item.name
              )}
            </span>
            <span className="shrink-0 tabular-nums text-slate-600">{item.valueLabel}</span>
          </div>
          <div aria-hidden className="h-2 bg-slate-100">
            <div className="h-2 rounded-r-[4px]" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: SERIES }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
