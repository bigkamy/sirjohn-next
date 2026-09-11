"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatPrice } from "@/lib/format";

export type TrendPoint = { label: string; fullLabel: string; value: number; detail?: string };

type TrendChartProps = {
  /** Names the measure; also the table column heading. */
  title: string;
  points: TrendPoint[];
  format: "currency" | "number";
  variant?: "column" | "line";
  emptyText?: string;
};

// One series, so one colour: brand emerald, checked against the white chart surface with the
// dataviz palette validator (lightness band, chroma, and ≥ 3:1 contrast all pass).
const SERIES = "#047857";
const PLOT_HEIGHT = 200;

function niceMax(max: number, integers: boolean) {
  if (max <= 0) return integers ? 2 : 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const scaled = max / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  const nice = step * magnitude;
  return integers ? Math.max(2, Math.ceil(nice)) : nice;
}

function compact(value: number) {
  if (value >= 1e7) return `${+(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `${+(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `${+(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value * 10) / 10);
}

/**
 * A single-series trend: columns for daily amounts, a line for running totals. Hover, or focus
 * the chart and use the arrow keys, to read a day; every value is also in the table view.
 */
export function TrendChart({ title, points, format, variant = "column", emptyText }: TrendChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const readoutId = useId();
  const count = points.length;

  const show = (value: number) => (format === "currency" ? formatPrice(value) : value.toLocaleString("en-IN"));
  const tickLabel = (value: number) => (format === "currency" ? `₹${compact(value)}` : compact(value));

  const max = niceMax(Math.max(0, ...points.map((point) => point.value)), format === "number");
  const ticks = format === "number" && (max / 2) % 1 !== 0 ? [max, 0] : [max, max / 2, 0];
  const x = (index: number) => (count <= 1 ? 50 : variant === "column" ? ((index + 0.5) / count) * 100 : (index / (count - 1)) * 100);
  const y = (value: number) => 100 - (value / max) * 100;
  const allZero = points.every((point) => point.value === 0);

  const onKeyDown = (event: KeyboardEvent) => {
    if (count === 0) return;
    const current = active ?? count - 1;
    const next =
      event.key === "ArrowRight" ? Math.min(count - 1, current + 1) : event.key === "ArrowLeft" ? Math.max(0, current - 1) : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (count === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = variant === "column" ? Math.floor(ratio * count) : Math.round(ratio * (count - 1));
    setActive(Math.max(0, Math.min(count - 1, index)));
  };

  const coords = points.map((point, index) => [x(index), y(point.value)] as const);
  const linePath = coords.map(([cx, cy], index) => `${index === 0 ? "M" : "L"}${cx},${cy}`).join(" ");
  const areaPath = count > 1 ? `${linePath} L${coords[count - 1][0]},100 L${coords[0][0]},100 Z` : "";
  const activePoint = active === null ? null : points[active];
  const last = points[count - 1];
  const xLabels = [...new Set([0, Math.floor((count - 1) / 2), count - 1])].filter((index) => index >= 0 && index < count);

  return (
    <div>
      <div className="flex gap-3">
        <div aria-hidden className="relative w-14 shrink-0 text-right text-[11px] tabular-nums text-slate-500" style={{ height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(tick)}%` }}>
              {tickLabel(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            tabIndex={0}
            aria-label={`${title}. Use the left and right arrow keys to read each day.`}
            aria-describedby={readoutId}
            onKeyDown={onKeyDown}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            className="relative rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            style={{ height: PLOT_HEIGHT }}
          >
            {ticks.map((tick) => (
              <div key={tick} aria-hidden className={`absolute inset-x-0 h-px ${tick === 0 ? "bg-slate-300" : "bg-slate-100"}`} style={{ top: `${y(tick)}%` }} />
            ))}

            {variant === "column" ? (
              <div aria-hidden className="absolute inset-0 flex items-end gap-[2px]">
                {points.map((point, index) => (
                  <div key={point.fullLabel} className="flex h-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-6 rounded-t-[4px] transition-opacity"
                      style={{
                        height: point.value > 0 ? `max(2px, ${(point.value / max) * 100}%)` : 0,
                        backgroundColor: SERIES,
                        opacity: active === null || active === index ? 1 : 0.45,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {areaPath && <path d={areaPath} fill={SERIES} fillOpacity={0.1} />}
                  <path d={linePath} fill="none" stroke={SERIES} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                {last && (
                  <>
                    <span
                      aria-hidden
                      className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                      style={{ left: `${x(count - 1)}%`, top: `${y(last.value)}%`, backgroundColor: SERIES }}
                    />
                    <span
                      aria-hidden
                      className={`absolute -translate-x-full pr-2 text-xs font-semibold tabular-nums text-slate-700 ${y(last.value) < 15 ? "translate-y-1" : "-translate-y-[calc(100%+4px)]"}`}
                      style={{ left: `${x(count - 1)}%`, top: `${y(last.value)}%` }}
                    >
                      {show(last.value)}
                    </span>
                  </>
                )}
              </>
            )}

            {activePoint && active !== null && (
              <>
                {variant === "line" && (
                  <>
                    <div aria-hidden className="absolute inset-y-0 w-px bg-slate-300" style={{ left: `${x(active)}%` }} />
                    <span
                      aria-hidden
                      className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                      style={{ left: `${x(active)}%`, top: `${y(activePoint.value)}%`, backgroundColor: SERIES }}
                    />
                  </>
                )}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg -translate-y-[calc(100%+10px)] ${
                    x(active) < 20 ? "" : x(active) > 80 ? "-translate-x-full" : "-translate-x-1/2"
                  }`}
                  style={{ left: `${x(active)}%`, top: `${y(activePoint.value)}%` }}
                >
                  <p className="text-sm font-semibold tabular-nums text-slate-900">{show(activePoint.value)}</p>
                  <p className="text-slate-500">
                    {activePoint.fullLabel}
                    {activePoint.detail ? ` · ${activePoint.detail}` : ""}
                  </p>
                </div>
              </>
            )}
          </div>

          <div aria-hidden className="relative mt-2 h-4 text-[11px] text-slate-500">
            {xLabels.map((index) => (
              <span
                key={index}
                className={`absolute whitespace-nowrap ${index === 0 ? "" : index === count - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${index === 0 ? 0 : index === count - 1 ? 100 : x(index)}%` }}
              >
                {points[index].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p id={readoutId} aria-live="polite" className="sr-only">
        {activePoint ? `${activePoint.fullLabel}: ${show(activePoint.value)}` : ""}
      </p>
      {allZero && emptyText && <p className="mt-3 text-center text-sm text-slate-500">{emptyText}</p>}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-slate-600 hover:text-slate-900">View as table</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-100">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Day</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">{title}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {points.map((point) => (
                <tr key={point.fullLabel}>
                  <td className="px-3 py-1.5">{point.fullLabel}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {show(point.value)}
                    {point.detail ? ` (${point.detail})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
