"use client";

import { useActionState } from "react";
import { FormAlert, FormField, TextAreaField } from "@/components/auth/form-controls";
import { sendContactMessage } from "@/lib/storefront-actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, undefined);
  const values = state?.values;
  const errors = state?.fieldErrors;

  if (state?.message) {
    return <FormAlert message={state.message} />;
  }

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      <FormField label="Full Name" name="name" autoComplete="name" placeholder="John Doe" required defaultValue={values?.name} errors={errors?.name} />
      <FormField label="Email Address" name="email" type="email" autoComplete="email" placeholder="john@example.com" required defaultValue={values?.email} errors={errors?.email} />
      <FormField label="Phone Number (optional)" name="phone" type="tel" autoComplete="tel" placeholder="+91 90000 00000" defaultValue={values?.phone} errors={errors?.phone} />
      <FormField label="Subject" name="subject" placeholder="Product support" required defaultValue={values?.subject} errors={errors?.subject} />
      <TextAreaField
        className="md:col-span-2"
        label="Message"
        name="message"
        rows={5}
        placeholder="Tell us how we can help"
        required
        defaultValue={values?.message}
        errors={errors?.message}
      />
      {state?.error && (
        <div className="md:col-span-2">
          <FormAlert error={state.error} />
        </div>
      )}
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="w-full rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}
