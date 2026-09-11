"use client";

import { useActionState } from "react";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/form-controls";
import { register } from "@/lib/auth/actions";

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(register, undefined);
  const errors = state?.fieldErrors;
  const values = state?.values;

  return (
    <form action={formAction} className="mt-8 grid gap-5 md:grid-cols-2">
      <input type="hidden" name="next" value={next} />
      <FormField
        label="First Name"
        name="firstName"
        autoComplete="given-name"
        placeholder="John"
        required
        defaultValue={values?.firstName}
        errors={errors?.firstName}
      />
      <FormField
        label="Last Name"
        name="lastName"
        autoComplete="family-name"
        placeholder="Doe"
        required
        defaultValue={values?.lastName}
        errors={errors?.lastName}
      />
      <FormField
        className="md:col-span-2"
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        defaultValue={values?.email}
        errors={errors?.email}
      />
      <FormField
        className="md:col-span-2"
        label="Phone (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+91 90000 00000"
        defaultValue={values?.phone}
        errors={errors?.phone}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        errors={errors?.password}
      />
      <FormField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        errors={errors?.confirmPassword}
      />

      <div className="space-y-5 md:col-span-2">
        <FormAlert error={state?.error} message={state?.message} />
        <SubmitButton pending={pending} pendingLabel="Creating account…">
          Create Account
        </SubmitButton>
      </div>
    </form>
  );
}
