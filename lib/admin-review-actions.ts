"use server";

import { revalidatePath } from "next/cache";
import { isReviewStatus } from "@/lib/admin-reviews";
import { logAdminError } from "@/lib/admin/log";
import { requirePermission } from "@/lib/auth/dal";
import { invalidateCatalog } from "@/lib/revalidate-catalog";
import { createClient } from "@/lib/supabase/server";
import { isPositiveInteger } from "@/lib/validation";

type Result = { ok: boolean; message: string };

const MESSAGES = { approved: "Review published.", rejected: "Review rejected.", pending: "Review moved back to pending." };

/** Approving publishes a review and updates the product's rating; rejecting hides it. */
export async function moderateReview(id: number, status: string): Promise<Result> {
  await requirePermission("reviews.manage", "/admin/reviews");
  if (!isPositiveInteger(id) || !isReviewStatus(status)) {
    return { ok: false, message: "This review could not be found." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_moderate_review", { p_review_id: id, p_status: status });
  if (error) {
    if (error.message === "review_not_found") return { ok: false, message: "This review no longer exists." };
    await logAdminError("review.moderate", "review", String(id), error.message);
    return { ok: false, message: "We couldn't update this review. Please try again." };
  }

  // Ratings on product pages and cards are cached with the catalog.
  invalidateCatalog();
  revalidatePath("/admin/reviews");
  return { ok: true, message: MESSAGES[status] };
}

export async function deleteReview(id: number): Promise<Result> {
  await requirePermission("reviews.manage", "/admin/reviews");
  if (!isPositiveInteger(id)) {
    return { ok: false, message: "This review could not be found." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_review", { p_review_id: id });
  if (error) {
    if (error.message === "review_not_found") return { ok: false, message: "This review no longer exists." };
    await logAdminError("review.delete", "review", String(id), error.message);
    return { ok: false, message: "We couldn't delete this review. Please try again." };
  }

  invalidateCatalog();
  revalidatePath("/admin/reviews");
  return { ok: true, message: "Review deleted." };
}
