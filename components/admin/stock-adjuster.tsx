"use client";

import { useState, useTransition } from "react";
import { adjustStock } from "@/lib/admin-product-actions";
import { NETWORK_ERROR } from "@/lib/messages";

/** Adds or removes units relative to live stock, so it can't undo a sale made meanwhile. */
export function StockAdjuster({ productId, name, stock }: { productId: number; name: string; stock: number }) {
  const [units, setUnits] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = (direction: 1 | -1) =>
    startTransition(async () => {
      const amount = Number(units);
      if (!Number.isInteger(amount) || amount <= 0) {
        setResult({ ok: false, message: "Enter a whole number of units." });
        return;
      }
      try {
        const response = await adjustStock(productId, direction * amount);
        setResult(response);
        if (response.ok) setUnits("");
      } catch {
        setResult({ ok: false, message: NETWORK_ERROR });
      }
    });

  return (
    <div className="min-w-[190px]">
      <div className={`font-semibold ${stock === 0 ? "text-red-600" : "text-slate-900"}`}>{stock} in stock</div>
      <div className="mt-2 flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={units}
          onChange={(event) => setUnits(event.target.value)}
          aria-label={`Units of ${name} to add or remove`}
          className="w-16 rounded-xl border border-slate-200 bg-[#f7f9f7] px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
        />
        <button type="button" disabled={pending} onClick={() => apply(1)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60">
          Add
        </button>
        <button type="button" disabled={pending} onClick={() => apply(-1)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:text-red-600 disabled:opacity-60">
          Remove
        </button>
      </div>
      {result && <p className={`mt-1 text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.message}</p>}
    </div>
  );
}
