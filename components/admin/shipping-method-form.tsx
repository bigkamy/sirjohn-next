"use client";

import { startTransition, useActionState } from "react";
import { Card, CardHeader } from "@/components/admin/ui/primitives";
import { Checkbox, Field, FormError } from "@/components/admin/ui/fields";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { updateShippingMethod } from "@/lib/admin-actions";
import type { FormState } from "@/lib/form-state";
import { NETWORK_ERROR } from "@/lib/messages";
import type { ShippingMethod } from "@/lib/shipping";

export function ShippingMethodForm({ method }: { method: ShippingMethod }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(async (previous: FormState, formData: FormData): Promise<FormState> => {
    const result = await updateShippingMethod(previous, formData).catch(() => ({ error: NETWORK_ERROR }) as FormState);
    if (result?.message) toast({ message: result.message });
    else if (result?.error && !result.fieldErrors) toast({ tone: "error", message: result.error });
    return result;
  }, undefined);

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
    <Card>
      <CardHeader title={method.name} action={<span className="font-mono text-xs text-slate-400">{method.code}</span>} />
      <form
        action={formAction}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
        aria-label={`${method.name} settings`}
        className="space-y-4 p-5"
      >
        <input type="hidden" name="code" value={method.code} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={id("name")} label="Name" name="name" required defaultValue={defaults.name} errors={errors?.name} />
          <Field id={id("description")} label="Description shown at checkout" name="description" defaultValue={defaults.description} errors={errors?.description} />
          <Field id={id("price")} label="Price (₹)" name="price" type="number" min={0} step="1" required defaultValue={defaults.price} errors={errors?.price} />
          <Field
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
        <Checkbox name="isActive" label="Offer this method at checkout" defaultChecked={method.isActive} />
        {state?.fieldErrors && <FormError message={state.error} />}
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </Card>
  );
}
