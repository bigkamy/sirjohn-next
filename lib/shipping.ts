import "server-only";
import { unstable_cache } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

/** Cache tag for anything derived from shipping_methods; admin edits revalidate it. */
export const SHIPPING_CACHE_TAG = "shipping-methods";

export type ShippingMethod = {
  code: string;
  name: string;
  description: string;
  price: number;
  freeOver: number | null;
  isActive: boolean;
};

/**
 * The lowest free-shipping threshold among active methods, for storefront copy such as
 * "Free shipping over ₹2,999". Null when shipping is never free (or Supabase is off).
 */
export const getFreeShippingThreshold = unstable_cache(
  async (): Promise<number | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await createPublicClient()
      .from("shipping_methods")
      .select("free_over")
      .eq("is_active", true)
      .not("free_over", "is", null)
      .order("free_over")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to load shipping threshold:", error.message);
      return null;
    }
    return data ? Number(data.free_over) : null;
  },
  ["free-shipping-threshold"],
  { tags: [SHIPPING_CACHE_TAG], revalidate: 300 },
);

export type ShippingRate = { name: string; price: number; freeOver: number | null };

/**
 * Active shipping methods, for the Shipping Policy page. Only names and charges: delivery
 * times are left for the business to state in the policy itself. Cached; admin edits revalidate it.
 */
export const getActiveShippingRates = unstable_cache(
  async (): Promise<ShippingRate[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await createPublicClient()
      .from("shipping_methods")
      .select("name,price,free_over")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Failed to load shipping rates:", error.message);
      return [];
    }

    return data.map((row) => ({
      name: row.name,
      price: Number(row.price),
      freeOver: row.free_over === null ? null : Number(row.free_over),
    }));
  },
  ["shipping-rates"],
  { tags: [SHIPPING_CACHE_TAG], revalidate: 300 },
);

export async function listShippingMethodsForAdmin(): Promise<ShippingMethod[]> {
  await requireAdmin("/admin/shipping");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_methods")
    .select("code,name,description,price,free_over,is_active")
    .order("sort_order");

  if (error) {
    throw new Error(`Failed to load shipping methods: ${error.message}`);
  }

  return data.map((row) => ({
    code: row.code,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    freeOver: row.free_over === null ? null : Number(row.free_over),
    isActive: row.is_active,
  }));
}
