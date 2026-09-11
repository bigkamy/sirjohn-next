"use client";

import { useState, useTransition } from "react";
import { removeSampleProducts } from "@/lib/admin-product-actions";
import { NETWORK_ERROR } from "@/lib/messages";

export function RemoveSamplesButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function remove() {
    const noun = count === 1 ? "sample product" : `${count} sample products`;
    if (!window.confirm(`Delete ${count === 1 ? "the" : "all"} ${noun}? Past orders keep their item details.`)) {
      return;
    }
    startTransition(async () => {
      setResult(await removeSampleProducts().catch(() => ({ ok: false, message: NETWORK_ERROR })));
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove Sample Products"}
      </button>
      {result && (
        <p role="status" className={`mt-2 text-sm ${result.ok ? "text-emerald-700" : "text-red-600"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
