"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { FormAlert, FormField, TextAreaField } from "@/components/auth/form-controls";
import { submitReview } from "@/lib/review-actions";
import type { MyReview } from "@/lib/reviews";

const STATUS_TEXT: Record<MyReview["status"], string> = {
  pending: "Waiting for approval",
  approved: "Published on the store",
  rejected: "Not published",
};

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex text-amber-500" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={size} className={index < rating ? "fill-current" : "text-slate-300"} aria-hidden />
      ))}
    </span>
  );
}

/** Review form for one product from a delivered order; shows the saved review and its status. */
export function ReviewForm({ productId, productName, orderNumber, existing }: { productId: number; productName: string; orderNumber: string; existing?: MyReview }) {
  const [state, formAction, pending] = useActionState(submitReview, undefined);
  const [editing, setEditing] = useState(!existing);
  const values = { rating: existing ? String(existing.rating) : "", title: existing?.title ?? "", body: existing?.body ?? "", ...state?.values };
  const [rating, setRating] = useState(Number(values.rating) || 0);
  const errors = state?.fieldErrors;
  const prefix = `review-${productId}`;

  // After a successful save; the page reloads with the review marked as waiting for approval.
  if (state?.message) {
    return <FormAlert message={state.message} />;
  }

  if (existing && !editing) {
    return (
      <div className="rounded-2xl bg-[#faf8f5] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Stars rating={existing.rating} />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{STATUS_TEXT[existing.status]}</span>
        </div>
        {existing.title && <p className="mt-2 font-semibold text-slate-900">{existing.title}</p>}
        <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{existing.body}</p>
        <button type="button" onClick={() => setEditing(true)} className="mt-3 text-sm font-semibold text-brand-700">
          Edit review
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} aria-label={`Review ${productName}`} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-slate-700">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
              />
              <Star
                size={26}
                aria-hidden
                className={`rounded peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 ${value <= rating ? "fill-amber-400 text-amber-500" : "text-slate-300"}`}
              />
              <span className="sr-only">
                {value} {value === 1 ? "star" : "stars"}
              </span>
            </label>
          ))}
        </div>
        {errors?.rating && <p className="mt-1.5 text-xs text-red-600">{errors.rating[0]}</p>}
      </fieldset>
      <FormField id={`${prefix}-title`} label="Title (optional)" name="title" maxLength={120} defaultValue={values.title} errors={errors?.title} />
      <TextAreaField id={`${prefix}-body`} label="Your review" name="body" rows={4} required minLength={10} maxLength={2000} defaultValue={values.body} errors={errors?.body} />
      <FormAlert error={state?.error} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Sending…" : existing ? "Update Review" : "Submit Review"}
        </button>
        {existing && (
          <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-slate-600">
            Cancel
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">Reviews show your first name and last initial. We check each one before it goes live.</p>
    </form>
  );
}
