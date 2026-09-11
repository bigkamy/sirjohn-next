"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { setLowStockThreshold } from "@/lib/admin-product-actions";
import { NETWORK_ERROR } from "@/lib/messages";

export function ThresholdEditor({ productId, name, threshold }: { productId: number; name: string; threshold: number }) {
  const toast = useToast();
  const [value, setValue] = useState(String(threshold));
  const [pending, startTransition] = useTransition();
  const changed = value !== String(threshold);

  const save = () =>
    startTransition(async () => {
      const next = Number(value);
      const result = await setLowStockThreshold(productId, next).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      toast({ tone: result.ok ? "success" : "error", message: result.ok ? `${name}: ${result.message}` : result.message });
    });

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={`Low-stock alert level for ${name}`}
        className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
      {changed && (
        <button type="submit" disabled={pending} className={buttonClass("secondary", "sm")}>
          {pending ? "Saving…" : "Save"}
        </button>
      )}
    </form>
  );
}
