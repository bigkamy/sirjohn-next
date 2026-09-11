import "server-only";
import { unstable_cache } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { CATALOG_CACHE_TAG } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type PublicReview = {
  id: number;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type MyReview = {
  productId: number;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  updatedAt: string;
};

/**
 * Published reviews for a product page. Only approved reviews are readable, and only their
 * public columns (never who wrote them). Cached with the catalog; moderation refreshes it.
 */
export const getApprovedReviews = unstable_cache(
  async (productId: number): Promise<PublicReview[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await createPublicClient()
      .from("product_reviews")
      .select("id,rating,title,body,author_name,created_at")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load reviews:", error.message);
      return [];
    }
    return data.map((row) => ({
      id: row.id,
      rating: row.rating,
      title: row.title,
      body: row.body,
      authorName: row.author_name,
      createdAt: row.created_at,
    }));
  },
  ["approved-reviews"],
  { tags: [CATALOG_CACHE_TAG], revalidate: 300 },
);

/** The signed-in customer's reviews, keyed by product, with their moderation status. */
export async function getMyReviews(): Promise<Map<number, MyReview>> {
  await requireUser("/account/orders");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_reviews");
  if (error) {
    throw new Error(`Failed to load your reviews: ${error.message}`);
  }

  const rows = data as { product_id: number; rating: number; title: string; body: string; status: ReviewStatus; updated_at: string }[];
  return new Map(
    rows.map((row) => [
      row.product_id,
      { productId: row.product_id, rating: row.rating, title: row.title, body: row.body, status: row.status, updatedAt: row.updated_at },
    ]),
  );
}
