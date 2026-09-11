"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/lib/admin-actions";
import { NETWORK_ERROR } from "@/lib/messages";

// Mirrors the transitions admin_set_order_status allows; the database enforces them.
const NEXT_STATUSES: Record<string, string[]> = {
  pending: ["processing", "shipped", "delivered", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function OrderStatusControl({ orderNumber, status }: { orderNumber: string; status: string }) {
  const options = NEXT_STATUSES[status] ?? [];
  const [choice, setChoice] = useState(options[0] ?? "");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // After an update the allowed statuses change; fall back to the first valid one.
  const next = options.includes(choice) ? choice : (options[0] ?? "");

  if (options.length === 0) {
    return (
      <div>
        {result && <p role="status" className="mb-2 text-sm text-emerald-700">{result.message}</p>}
        <p className="text-sm text-slate-500">This order is {status} and can no longer be changed.</p>
      </div>
    );
  }

  function submit() {
    if (next === "cancelled" && !window.confirm("Cancel this order? Its items go back into stock.")) {
      return;
    }
    startTransition(async () => {
      try {
        setResult(await updateOrderStatus(orderNumber, next));
      } catch {
        setResult({ ok: false, message: NETWORK_ERROR });
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="order-status" className="text-sm font-medium text-slate-700">Change status to</label>
        <select
          id="order-status"
          value={next}
          onChange={(event) => setChoice(event.target.value)}
          className="rounded-full border border-slate-200 bg-[#f7f9f7] px-4 py-2 text-sm capitalize text-slate-700 outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option} className="capitalize">{option}</option>
          ))}
        </select>
        <button type="button" disabled={pending} onClick={submit} className="rounded-full bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Updating…" : "Update Status"}
        </button>
      </div>
      {result && (
        <p role="status" className={`mt-2 text-sm ${result.ok ? "text-emerald-700" : "text-red-600"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
