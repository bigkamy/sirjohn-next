import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type AdminReview = {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  customerEmail: string | null;
  authorName: string;
  orderNumber: string | null;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  moderatedAt: string | null;
};

type ReviewRow = {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  customer_email: string | null;
  author_name: string;
  order_number: string | null;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  created_at: string;
  moderated_at: string | null;
  total_count: number | string;
};

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}

/** Reviews with who wrote them (admin_list_reviews); the public table hides that. */
export async function listReviews({
  status,
  page = 1,
  pageSize = 20,
}: { status?: ReviewStatus; page?: number; pageSize?: number } = {}): Promise<{ reviews: AdminReview[]; total: number }> {
  await requirePermission("reviews.manage", "/admin/reviews");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_reviews", {
    p_status: status ?? null,
    p_limit: pageSize,
    p_offset: (Math.max(1, page) - 1) * pageSize,
  });
  if (error) {
    throw new Error(`Failed to load reviews: ${error.message}`);
  }

  const rows = data as ReviewRow[];
  return {
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    reviews: rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      productSlug: row.product_slug,
      customerEmail: row.customer_email,
      authorName: row.author_name,
      orderNumber: row.order_number,
      rating: row.rating,
      title: row.title,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
      moderatedAt: row.moderated_at,
    })),
  };
}
