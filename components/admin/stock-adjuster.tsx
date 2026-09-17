"use client";

import { Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { adjustStock } from "@/lib/admin-product-actions";
import { NETWORK_ERROR } from "@/lib/messages";

/** Adds or removes units relative to live stock, so it can't undo a sale made meanwhile. */
export function StockAdjuster({ productId, name, stock }: { productId: number; name: string; stock: number }) {
  const toast = useToast();
  const [units, setUnits] = useState("");
  const [pending, startTransition] = useTransition();

  const apply = (direction: 1 | -1) =>
    startTransition(async () => {
      const amount = Number(units);
      if (!Number.isInteger(amount) || amount <= 0) {
        toast({ tone: "error", message: "Enter a whole number of units." });
        return;
      }
      const result = await adjustStock(productId, direction * amount).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      toast({ tone: result.ok ? "success" : "error", message: result.ok ? `${name}: ${result.message}` : result.message });
      if (result.ok) setUnits("");
    });

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-12 text-right text-sm font-semibold tabular-nums ${stock === 0 ? "text-red-600" : "text-slate-900"}`}>{stock}</span>
      <input
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        value={units}
        onChange={(event) => setUnits(event.target.value)}
        aria-label={`Units of ${name} to add or remove`}
        placeholder="Qty"
        className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
      <button type="button" disabled={pending} onClick={() => apply(1)} aria-label={`Add units to ${name}`} className={buttonClass("secondary", "sm")}>
        <Plus size={13} aria-hidden /> Add
      </button>
      <button type="button" disabled={pending} onClick={() => apply(-1)} aria-label={`Remove units from ${name}`} className={buttonClass("secondary", "sm")}>
        <Minus size={13} aria-hidden /> Remove
      </button>
    </div>
  );
}
