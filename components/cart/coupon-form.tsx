"use client";

import { useActionState, useState, useTransition } from "react";
import type { CartQuote } from "@/lib/cart";
import { applyCoupon, removeCoupon } from "@/lib/cart-actions";
import { couponStatusMessage } from "@/lib/coupons";
import { NETWORK_ERROR } from "@/lib/messages";

export function CouponForm({ coupon }: { coupon: CartQuote["coupon"] }) {
  const [state, formAction, pending] = useActionState(applyCoupon, undefined);
  const [removing, startTransition] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  if (coupon) {
    const applied = coupon.status === "applied";
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-[#faf8f5] p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-900">{coupon.code}</span>
          <button
            type="button"
            disabled={removing}
            onClick={() =>
              startTransition(async () => {
                setRemoveError(null);
                await removeCoupon().catch(() => setRemoveError(NETWORK_ERROR));
              })
            }
            className="font-medium text-slate-500 hover:text-red-500 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
        <p className={`mt-1 ${applied ? "text-brand-700" : "text-red-600"}`}>
          {couponStatusMessage(coupon.status, coupon.minSubtotal)}
        </p>
        {removeError && (
          <p role="alert" className="mt-1 text-red-600">
            {removeError}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6">
      <input
        type="text"
        name="code"
        aria-label="Coupon code"
        placeholder="Coupon code"
        defaultValue={state?.values?.code}
        className="w-full rounded-full border border-slate-200 bg-[#faf8f5] px-4 py-3 text-sm text-slate-700 outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Applying…" : "Apply Coupon"}
      </button>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
