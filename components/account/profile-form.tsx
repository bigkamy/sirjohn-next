"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert, FormField } from "@/components/auth/form-controls";
import { updateProfile } from "@/lib/profile-actions";

type ProfileFormProps = {
  email: string;
  profile: { firstName: string; lastName: string; phone: string };
};

export function ProfileForm({ email, profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);
  const defaults = { ...profile, ...state?.values };
  const errors = state?.fieldErrors;

  return (
    <form action={formAction} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="First Name"
          name="firstName"
          autoComplete="given-name"
          required
          defaultValue={defaults.firstName}
          errors={errors?.firstName}
        />
        <FormField
          label="Last Name"
          name="lastName"
          autoComplete="family-name"
          required
          defaultValue={defaults.lastName}
          errors={errors?.lastName}
        />
        <div className="md:col-span-2">
          <FormField label="Email" name="email" type="email" readOnly value={email} aria-describedby="email-note" />
          <p id="email-note" className="mt-1.5 text-xs text-slate-500">
            This is the email you sign in with. It can’t be changed here.
          </p>
        </div>
        <FormField
          className="md:col-span-2"
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 90000 00000"
          defaultValue={defaults.phone}
          errors={errors?.phone}
        />
      </div>

      <div className="mt-5">
        <FormAlert error={state?.error} message={state?.message} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
        <Link href="/account/reset-password" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">
          Change Password
        </Link>
      </div>
    </form>
  );
}
