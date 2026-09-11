"use client";

import { useActionState } from "react";
import { FormAlert, FormField } from "@/components/auth/form-controls";
import { updateShippingMethod } from "@/lib/admin-actions";
import type { ShippingMethod } from "@/lib/shipping";

export function ShippingMethodForm({ method }: { method: ShippingMethod }) {
  const [state, formAction, pending] = useActionState(updateShippingMethod, undefined);
  const defaults = {
    name: method.name,
    description: method.description,
    price: String(method.price),
    freeOver: method.freeOver === null ? "" : String(method.freeOver),
    ...state?.values,
  };
  const errors = state?.fieldErrors;
  // Field ids must be unique per form, since several forms share the page.
  const id = (name: string) => `${method.code}-${name}`;

  return (
    <form action={formAction} aria-label={`${method.name} settings`} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="code" value={method.code} />
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{method.name}</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{method.code}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id={id("name")} label="Name" name="name" required defaultValue={defaults.name} errors={errors?.name} />
        <FormField id={id("description")} label="Delivery time" name="description" defaultValue={defaults.description} errors={errors?.description} />
        <FormField
          id={id("price")}
          label="Price (₹)"
          name="price"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={defaults.price}
          errors={errors?.price}
        />
        <FormField
          id={id("freeOver")}
          label="Free when order reaches (₹, blank = never)"
          name="freeOver"
          type="number"
          min={0}
          step="1"
          defaultValue={defaults.freeOver}
          errors={errors?.freeOver}
        />
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="isActive" defaultChecked={method.isActive} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
        Offer this method at checkout
      </label>

      <div className="mt-5">
        <FormAlert error={state?.error} message={state?.message} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
