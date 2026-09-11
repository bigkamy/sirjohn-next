"use server";

import { refresh } from "next/cache";
import { getCurrentUser, requireUser } from "@/lib/auth/dal";
import { addToCart } from "@/lib/cart-actions";
import { getProductById, getProductBySlug } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { isPositiveInteger } from "@/lib/validation";

type WishlistResult = { ok: boolean; message: string; saved?: boolean; needsLogin?: boolean };

const UNAVAILABLE: WishlistResult = { ok: false, message: "This product is no longer available." };
const FAILED: WishlistResult = { ok: false, message: "We couldn't update your wishlist. Please try again." };

export async function toggleWishlist(slug: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, needsLogin: true, message: "Log in to save items to your wishlist." };
  }

  const product = typeof slug === "string" ? await getProductBySlug(slug) : undefined;
  if (!product) {
    return UNAVAILABLE;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", product.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", product.id)
    : await supabase
        .from("wishlist_items")
        .upsert({ user_id: user.id, product_id: product.id }, { onConflict: "user_id,product_id", ignoreDuplicates: true });

  if (error) {
    console.error("Wishlist update failed:", error.message);
    return FAILED;
  }

  refresh();
  return {
    ok: true,
    saved: !existing,
    message: existing ? `${product.name} removed from your wishlist.` : `${product.name} saved to your wishlist.`,
  };
}

export async function removeFromWishlist(productId: number): Promise<WishlistResult> {
  const user = await requireUser("/account/wishlist");
  if (!isPositiveInteger(productId)) {
    return UNAVAILABLE;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
  if (error) {
    console.error("Wishlist removal failed:", error.message);
    return FAILED;
  }

  refresh();
  return { ok: true, message: "Removed from your wishlist." };
}

/** Adds one unit to the cart and drops it from the wishlist. Configurable products are
 * sent to their product page instead, since options must be chosen first. */
export async function moveWishlistItemToCart(productId: number): Promise<WishlistResult> {
  const user = await requireUser("/account/wishlist");
  const product = isPositiveInteger(productId) ? await getProductById(productId) : undefined;
  if (!product) {
    return UNAVAILABLE;
  }

  const added = await addToCart(product.slug, 1);
  if (!added.ok) {
    return { ok: false, message: added.message };
  }

  const supabase = await createClient();
  await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", product.id);

  refresh();
  return { ok: true, message: `${product.name} moved to your cart.` };
}
