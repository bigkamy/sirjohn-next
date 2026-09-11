"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireUser } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { formText, isPositiveInteger } from "@/lib/validation";

const reviewSchema = z.object({
  rating: z.number({ error: "Choose a star rating." }).int().min(1, { error: "Choose a star rating." }).max(5),
  title: z.string().max(120, { error: "Keep the title to 120 characters." }),
  body: z.string().min(10, { error: "Write at least 10 characters." }).max(2000, { error: "Keep your review to 2,000 characters." }),
});

/** Saves a verified buyer's review. It waits for moderation before appearing on the store. */
export async function submitReview(_state: FormState, formData: FormData): Promise<FormState> {
  const orderNumber = formText(formData, "orderNumber");
  await requireUser(`/account/orders/${encodeURIComponent(orderNumber)}`);

  const productId = Number(formText(formData, "productId"));
  const values = { rating: formText(formData, "rating"), title: formText(formData, "title"), body: formText(formData, "body") };
  if (!isPositiveInteger(productId)) {
    return { error: "This product can no longer be reviewed.", values };
  }

  const parsed = reviewSchema.safeParse({ rating: values.rating === "" ? Number.NaN : Number(values.rating), title: values.title, body: values.body });
  if (!parsed.success) {
    return { error: "Please check your review.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_product_review", {
    p_product_id: productId,
    p_rating: parsed.data.rating,
    p_title: parsed.data.title,
    p_body: parsed.data.body,
  });
  if (error) {
    if (error.message === "not_purchased") {
      return { error: "You can review products from your delivered orders.", values };
    }
    console.error("Saving review failed:", error.message);
    return { error: "We couldn't save your review. Please try again.", values };
  }

  revalidatePath(`/account/orders/${orderNumber}`);
  return { message: "Thank you! Your review will appear on the store once it's been approved." };
}
