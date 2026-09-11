"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState, useTransition } from "react";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { Checkbox, Field, FormError, Select } from "@/components/admin/ui/fields";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { deleteCoupon, saveCoupon, setCouponActive } from "@/lib/admin-coupon-actions";
import type { FormState } from "@/lib/form-state";
import { NETWORK_ERROR } from "@/lib/messages";

export type CouponFormValues = Record<string, string>;

export function CouponForm({ couponId, defaults }: { couponId?: number; defaults: CouponFormValues }) {
  const toast = useToast();
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(async (previous: FormState, formData: FormData): Promise<FormState> => {
    const result = await saveCoupon(previous, formData).catch(() => ({ error: NETWORK_ERROR }) as FormState);
    if (result?.message) {
      toast({ message: result.message });
      if (couponId) router.push("/admin/coupons");
      else setFormKey((key) => key + 1);
    } else if (result?.error && !result.fieldErrors) {
      toast({ tone: "error", message: result.error });
    }
    return result;
  }, undefined);

  const values = { ...defaults, ...state?.values };
  const errors = state?.fieldErrors;
  const [type, setType] = useState(values.discountType || "percent");

  return (
    <form
      key={formKey}
      action={formAction}
      // Submitted by hand so React doesn't reset the fields after a failed save.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      aria-label={couponId ? "Edit coupon" : "Create coupon"}
      className="space-y-4 p-5"
    >
      {couponId && <input type="hidden" name="id" value={couponId} />}
      <Field label="Code" name="code" required defaultValue={values.code} errors={errors?.code} placeholder="SUMMER10" hint="Customers type this at checkout. Letters are saved in capitals." />
      <Field label="Description (for staff)" name="description" defaultValue={values.description} errors={errors?.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Discount type" name="discountType" value={type} onChange={(event) => setType(event.target.value)} errors={errors?.discountType}>
          <option value="percent">Percentage</option>
          <option value="fixed">Fixed amount (₹)</option>
        </Select>
        <Field label={type === "percent" ? "Discount (%)" : "Discount (₹)"} name="value" type="number" min={0} step="any" required defaultValue={values.value} errors={errors?.value} />
        <Field label="Minimum order (₹)" name="minSubtotal" type="number" min={0} step="1" defaultValue={values.minSubtotal} errors={errors?.minSubtotal} />
        {type === "percent" && (
          <Field label="Maximum discount (₹, optional)" name="maxDiscount" type="number" min={0} step="1" defaultValue={values.maxDiscount} errors={errors?.maxDiscount} />
        )}
        <Field label="Usage limit (optional)" name="usageLimit" type="number" min={1} step="1" defaultValue={values.usageLimit} errors={errors?.usageLimit} hint="Total uses across all customers." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts (optional)" name="startsAt" type="datetime-local" defaultValue={values.startsAt} errors={errors?.startsAt} hint="India time" />
        <Field label="Ends (optional)" name="expiresAt" type="datetime-local" defaultValue={values.expiresAt} errors={errors?.expiresAt} hint="India time" />
      </div>
      <Checkbox name="isActive" label="Active" description="Switched-off coupons are rejected at checkout." defaultChecked={values.isActive === "on"} />
      {state?.fieldErrors && <FormError message={state.error} />}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Saving…" : couponId ? "Save Coupon" : "Create Coupon"}
        </button>
        {couponId && (
          <button type="button" onClick={() => router.push("/admin/coupons")} className={buttonClass("ghost")}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function CouponActiveSwitch({ id, code, isActive }: { id: number; code: string; isActive: boolean }) {
  const toast = useToast();
  const [on, setOn] = useState(isActive);
  const [pending, startSwitch] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${code} active`}
      disabled={pending}
      onClick={() =>
        startSwitch(async () => {
          const result = await setCouponActive(id, !on).catch(() => ({ ok: false, message: NETWORK_ERROR }));
          if (result.ok) setOn(!on);
          toast({ tone: result.ok ? "success" : "error", message: result.message });
        })
      }
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${on ? "bg-emerald-600" : "bg-slate-300"}`}
    >
      <span aria-hidden className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function DeleteCouponButton({ id, code, usedCount }: { id: number; code: string; usedCount: number }) {
  const toast = useToast();
  return (
    <ConfirmButton
      label={<Trash2 size={14} aria-hidden />}
      ariaLabel={`Delete ${code}`}
      title={`Delete ${code}?`}
      description={
        usedCount > 0
          ? `It has been used ${usedCount} ${usedCount === 1 ? "time" : "times"}; those orders keep the code. Switching it off keeps its history visible here.`
          : "Customers will no longer be able to use it."
      }
      confirmLabel="Delete coupon"
      onConfirm={async () => {
        const result = await deleteCoupon(id).catch(() => ({ ok: false, message: NETWORK_ERROR }));
        toast({ tone: result.ok ? "success" : "error", message: result.message });
      }}
    />
  );
}
