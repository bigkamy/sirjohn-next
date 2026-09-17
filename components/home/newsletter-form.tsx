"use client";

import { useActionState } from "react";
import { subscribeToNewsletter } from "@/lib/storefront-actions";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, undefined);

  if (state?.message) {
    return (
      <p role="status" className="rounded-full border border-brand-400/40 bg-brand-500/10 px-6 py-3 text-sm font-semibold text-brand-200">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          aria-label="Email address"
          placeholder="Enter your email"
          defaultValue={state?.values?.email}
          className="flex-1 rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-brand-400 disabled:opacity-60"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      )}
    </form>
  );
}
