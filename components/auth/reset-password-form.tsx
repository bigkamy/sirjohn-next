"use client";

import { useActionState } from "react";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/form-controls";
import { updatePassword } from "@/lib/auth/actions";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <FormField
        label="New Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        errors={state?.fieldErrors?.password}
      />
      <FormField
        label="Confirm New Password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        errors={state?.fieldErrors?.confirmPassword}
      />
      <FormAlert error={state?.error} message={state?.message} />
      <SubmitButton pending={pending} pendingLabel="Saving…">
        Update Password
      </SubmitButton>
    </form>
  );
}
