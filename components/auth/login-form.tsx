"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/form-controls";
import { login } from "@/lib/auth/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        errors={state?.fieldErrors?.password}
      />

      <div className="flex justify-end text-sm">
        <Link href="/forgot-password" className="font-medium text-emerald-700">
          Forgot password?
        </Link>
      </div>

      <FormAlert error={state?.error} message={state?.message} />
      <SubmitButton pending={pending} pendingLabel="Logging in…">
        Login
      </SubmitButton>
    </form>
  );
}
