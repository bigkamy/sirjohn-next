"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCartQuote, parseLineKey, readGuestCart, writeCouponCode, writeGuestCart, type CartItem } from "@/lib/cart";
import { MAX_QUANTITY } from "@/lib/cart-limits";
import { couponStatusMessage } from "@/lib/coupons";
import type { FormState } from "@/lib/form-state";
import { optionsKey, validateOptions } from "@/lib/product-options";
import { getProductById, getProductBySlug } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type CartActionResult = { ok: boolean; message: string; needsOptions?: boolean };

const UNAVAILABLE: CartActionResult = { ok: false, message: "This product is no longer available." };
const UPDATE_FAILED: CartActionResult = { ok: false, message: "We couldn't update your cart. Please try again." };
const SESSION_EXPIRED: CartActionResult = { ok: false, message: "Your session has expired. Please log in again." };

// A cart line that belongs to the current shopper, resolved from its key.
type OwnedLine = { productId: number } & (
  | { kind: "db"; id: number; userId: string }
  | { kind: "guest"; optionsKey: string }
);

function clampQuantity(value: number) {
  return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 1), MAX_QUANTITY) : 1;
}

export async function addToCart(slug: string, quantity = 1, selectedOptions: unknown = {}): Promise<CartActionResult> {
  const product = typeof slug === "string" ? await getProductBySlug(slug) : undefined;
  if (!product) {
    return UNAVAILABLE;
  }
  if (product.stock < 1) {
    return { ok: false, message: `${product.name} is out of stock.` };
  }

  const choice = validateOptions(product.options, selectedOptions);
  if (!choice.ok) {
    return { ok: false, needsOptions: true, message: `Choose ${choice.missing.join(" and ").toLowerCase()} first.` };
  }

  const amount = clampQuantity(quantity);
  const user = await getCurrentUser();

  if (user) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("add_cart_items", {
      p_items: [{ product_id: product.id, quantity: amount, options: choice.options }],
    });
    if (error) {
      console.error("Add to cart failed:", error.message);
      return { ok: false, message: "We couldn't add this item. Please try again." };
    }
  } else {
    const items = await readGuestCart();
    const configuration = optionsKey(choice.options);
    const matches = (item: CartItem) => item.productId === product.id && optionsKey(item.options) === configuration;
    const existing = items.find(matches);
    const next = Math.min((existing?.quantity ?? 0) + amount, product.stock, MAX_QUANTITY);
    await writeGuestCart(
      existing
        ? items.map((item) => (matches(item) ? { ...item, quantity: next } : item))
        : [...items, { productId: product.id, quantity: next, options: choice.options }],
    );
  }

  return { ok: true, message: `${product.name} added to your cart.` };
}

export async function updateCartQuantity(lineKey: string, quantity: number): Promise<CartActionResult> {
  const line = await findOwnedLine(lineKey);
  if (line === "expired") {
    return SESSION_EXPIRED;
  }
  if (!line) {
    return UNAVAILABLE;
  }

  const product = await getProductById(line.productId);
  const next = product ? Math.min(clampQuantity(quantity), product.stock) : 0;
  if (!(await setLineQuantity(line, next < 1 ? null : next))) {
    return UPDATE_FAILED;
  }

  refresh();
  if (next < 1) {
    return product ? { ok: false, message: `${product.name} is out of stock.` } : UNAVAILABLE;
  }
  return { ok: true, message: next < quantity ? `Only ${next} available.` : "" };
}

export async function removeFromCart(lineKey: string): Promise<CartActionResult> {
  const line = await findOwnedLine(lineKey);
  if (line === "expired") {
    return SESSION_EXPIRED;
  }
  if (!line) {
    return UNAVAILABLE;
  }
  if (!(await setLineQuantity(line, null))) {
    return UPDATE_FAILED;
  }

  refresh();
  return { ok: true, message: "" };
}

export async function applyCoupon(_state: FormState, formData: FormData): Promise<FormState> {
  const value = formData.get("code");
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  const values = { code };

  if (!code) {
    return { error: "Enter a coupon code.", values };
  }
  if (!isSupabaseConfigured()) {
    return { error: "Coupons are unavailable until Supabase is configured.", values };
  }

  const quote = await getCartQuote({ couponCode: code });
  if (!quote.coupon || quote.coupon.status !== "applied") {
    return { error: couponStatusMessage(quote.coupon?.status ?? "invalid", quote.coupon?.minSubtotal ?? null), values };
  }

  await writeCouponCode(code);
  refresh();
  return { message: `Coupon ${code} applied.` };
}

export async function removeCoupon() {
  await writeCouponCode(null);
  refresh();
}

// "expired" means the line belongs to a signed-in cart but the session has since ended.
async function findOwnedLine(lineKey: unknown): Promise<OwnedLine | "expired" | null> {
  const ref = parseLineKey(lineKey);
  if (!ref) {
    return null;
  }
  if (ref.kind === "guest") {
    return ref;
  }

  const user = await getCurrentUser();
  if (!user) {
    return "expired";
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_items")
    .select("product_id")
    .eq("id", ref.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? { kind: "db", id: ref.id, userId: user.id, productId: data.product_id } : null;
}

/** Sets a line's quantity, or removes the line when quantity is null. */
async function setLineQuantity(line: OwnedLine, quantity: number | null) {
  if (line.kind === "db") {
    const supabase = await createClient();
    const { error } =
      quantity === null
        ? await supabase.from("cart_items").delete().eq("id", line.id).eq("user_id", line.userId)
        : await supabase.from("cart_items").update({ quantity }).eq("id", line.id).eq("user_id", line.userId);
    if (error) {
      console.error("Cart update failed:", error.message);
    }
    return !error;
  }

  const items = await readGuestCart();
  const matches = (item: CartItem) => item.productId === line.productId && optionsKey(item.options) === line.optionsKey;
  await writeGuestCart(
    quantity === null
      ? items.filter((item) => !matches(item))
      : items.map((item) => (matches(item) ? { ...item, quantity } : item)),
  );
  return true;
}
