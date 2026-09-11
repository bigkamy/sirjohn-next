"use client";

import { useState, useTransition } from "react";
import { setProductActive } from "@/lib/admin-product-actions";
import { NETWORK_ERROR } from "@/lib/messages";

export function ProductVisibilityToggle({ productId, name, isActive }: { productId: number; name: string; isActive: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setError(null);
      try {
        const result = await setProductActive(productId, !isActive);
        if (!result.ok) setError(result.message);
      } catch {
        setError(NETWORK_ERROR);
      }
    });

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        aria-label={`${isActive ? "Hide" : "Show"} ${name} ${isActive ? "from" : "in"} the store`}
        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
      >
        {isActive ? "Hide" : "Show"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
