"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert, FormField } from "@/components/auth/form-controls";
import { saveAddress } from "@/lib/address-actions";
import type { Address } from "@/lib/addresses";

type Field = {
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  type?: string;
  inputMode?: "numeric";
  span?: boolean;
  optional?: boolean;
};

const fields: Field[] = [
  { name: "label", label: "Label", placeholder: "Home, Work…", autoComplete: "off" },
  { name: "fullName", label: "Full Name", placeholder: "John Doe", autoComplete: "name" },
  { name: "phone", label: "Phone", placeholder: "+91 90000 00000", autoComplete: "tel", type: "tel", span: true },
  { name: "line1", label: "Address Line 1", placeholder: "22 Fairway Avenue", autoComplete: "address-line1", span: true },
  { name: "line2", label: "Address Line 2 (optional)", placeholder: "Apartment, floor, landmark", autoComplete: "address-line2", span: true, optional: true },
  { name: "city", label: "City", placeholder: "Bengaluru", autoComplete: "address-level2" },
  { name: "state", label: "State", placeholder: "Karnataka", autoComplete: "address-level1" },
  { name: "postalCode", label: "PIN Code", placeholder: "560001", autoComplete: "postal-code", inputMode: "numeric" },
];

export function AddressForm({ address }: { address?: Address }) {
  const [state, formAction, pending] = useActionState(saveAddress, undefined);
  const saved: Record<string, string> = address
    ? {
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
      }
    : {};
  const defaults = { ...saved, ...state?.values };

  return (
    <form action={formAction} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      {address && <input type="hidden" name="id" value={address.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <FormField
            key={field.name}
            className={field.span ? "md:col-span-2" : ""}
            label={field.label}
            name={field.name}
            type={field.type ?? "text"}
            inputMode={field.inputMode}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            required={!field.optional}
            defaultValue={defaults[field.name]}
            errors={state?.fieldErrors?.[field.name]}
          />
        ))}
      </div>

      {address?.isDefault ? (
        <p className="mt-5 text-sm text-slate-500">This is your default delivery address.</p>
      ) : (
        <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="isDefault" className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Make this my default address
        </label>
      )}

      {state?.error && (
        <div className="mt-5">
          <FormAlert error={state.error} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Address"}
        </button>
        <Link href="/account/addresses" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">
          Cancel
        </Link>
      </div>
    </form>
  );
}
