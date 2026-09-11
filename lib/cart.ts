import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import * as z from "zod";
import { getCurrentUser } from "@/lib/auth/dal";
import { MAX_QUANTITY } from "@/lib/cart-limits";
import type { CouponStatus } from "@/lib/coupons";
import { optionsKey, validateOptions, type SelectedOptions } from "@/lib/product-options";
import { sampleProducts } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

const MAX_GUEST_LINES = 50;
const CART_COOKIE = "sj_cart";
const COUPON_COOKIE = "sj_coupon";
const COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 } as const;

export type CartItem = { key: string; productId: number; quantity: number; options: SelectedOptions };

export type CartLine = {
  key: string;
  productId: number;
  slug: string;
  name: string;
  brand: string;
  image: string;
  options: SelectedOptions;
  /** False when the product's options changed after this line was added. */
  optionsValid: boolean;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
};

export type ShippingOption = { code: string; name: string; description: string; price: number };

export type CartQuote = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingMethod: string;
  shippingOptions: ShippingOption[];
  coupon: { code: string; status: CouponStatus; minSubtotal: number | null } | null;
};

// Shape of the jsonb returned by public.quote_cart.
type QuoteResponse = {
  items: {
    key: string;
    product_id: number;
    slug: string;
    name: string;
    brand: string;
    image: string;
    options: SelectedOptions;
    options_valid: boolean;
    unit_price: number;
    quantity: number;
    line_total: number;
    stock: number;
  }[];
  item_count: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shipping_method: string;
  shipping_options: ShippingOption[];
  coupon: { code: string; status: CouponStatus; min_subtotal: number | null } | null;
};

// Cart lines are addressed by key: "db:<cart_items.id>" for signed-in carts and
// "g:<productId>:<options>" for the guest cookie cart.
const dbLineKey = (id: number) => `db:${id}`;
const guestLineKey = (productId: number, options: SelectedOptions) => `g:${productId}:${optionsKey(options)}`;

export type LineRef = { kind: "db"; id: number } | { kind: "guest"; productId: number; optionsKey: string };

export function parseLineKey(key: unknown): LineRef | null {
  if (typeof key !== "string") {
    return null;
  }
  const [kind, idPart, ...rest] = key.split(":");
  const id = Number(idPart);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  if (kind === "db") {
    return { kind: "db", id };
  }
  if (kind === "g") {
    return { kind: "guest", productId: id, optionsKey: rest.join(":") };
  }
  return null;
}

// The cookie is client-controlled, so it only holds ids, quantities, and option
// choices — never prices. Options are re-validated whenever they are used.
const guestCartSchema = z
  .array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(MAX_QUANTITY),
      options: z.record(z.string().max(60), z.string().max(60)).default({}),
    }),
  )
  .max(MAX_GUEST_LINES);

const toRpcItems = (items: CartItem[]) =>
  items.map((item) => ({ key: item.key, product_id: item.productId, quantity: item.quantity, options: item.options }));

export async function readGuestCart(): Promise<CartItem[]> {
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  if (!raw) {
    return [];
  }

  try {
    const parsed = guestCartSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? parsed.data.map((item) => ({ ...item, key: guestLineKey(item.productId, item.options) }))
      : [];
  } catch {
    return [];
  }
}

export async function writeGuestCart(items: Omit<CartItem, "key">[]) {
  const cookieStore = await cookies();
  if (items.length === 0) {
    cookieStore.delete(CART_COOKIE);
    return;
  }

  const stored = items
    .slice(0, MAX_GUEST_LINES)
    .map(({ productId, quantity, options }) => ({ productId, quantity, options }));
  cookieStore.set(CART_COOKIE, JSON.stringify(stored), COOKIE_OPTIONS);
}

export async function readCouponCode() {
  return (await cookies()).get(COUPON_COOKIE)?.value ?? null;
}

export async function writeCouponCode(code: string | null) {
  const cookieStore = await cookies();
  if (code) {
    cookieStore.set(COUPON_COOKIE, code, COOKIE_OPTIONS);
  } else {
    cookieStore.delete(COUPON_COOKIE);
  }
}

/** The shopper's cart: the database cart when signed in, otherwise the guest cookie. */
async function readCartItems(): Promise<CartItem[]> {
  const user = await getCurrentUser();
  if (!user) {
    return readGuestCart();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("id,product_id,quantity,options")
    .eq("user_id", user.id)
    .order("created_at")
    .order("id");

  if (error) {
    throw new Error(`Failed to load cart: ${error.message}`);
  }

  return data.map((row) => ({
    key: dbLineKey(row.id),
    productId: row.product_id,
    quantity: row.quantity,
    options: row.options ?? {},
  }));
}

export async function getCartCount() {
  const items = await readCartItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Prices the cart with the database's quote_cart function, so totals never come from
 * the browser. Pass `couponCode` to price a code before it is saved.
 */
export async function getCartQuote(options: { couponCode?: string | null } = {}): Promise<CartQuote> {
  const [items, savedCoupon] = await Promise.all([readCartItems(), readCouponCode()]);

  if (!isSupabaseConfigured()) {
    return quoteSampleCatalog(items);
  }

  const { data, error } = await createPublicClient().rpc("quote_cart", {
    p_items: toRpcItems(items),
    p_shipping_method: null,
    p_coupon_code: options.couponCode === undefined ? savedCoupon : options.couponCode,
  });

  if (error) {
    throw new Error(`Failed to price cart: ${error.message}`);
  }

  return mapQuote(data as QuoteResponse);
}

/** Moves the guest cookie cart into the user's database cart. Call right after sign-in. */
export async function mergeGuestCart(supabase: SupabaseClient) {
  const items = await readGuestCart();
  if (items.length === 0) {
    return;
  }

  const { error } = await supabase.rpc("add_cart_items", { p_items: toRpcItems(items) });
  if (error) {
    // Keep the cookie so nothing is lost; the next sign-in retries the merge.
    console.error("Failed to merge guest cart:", error.message);
    return;
  }

  await writeGuestCart([]);
}

function mapQuote(quote: QuoteResponse): CartQuote {
  return {
    lines: quote.items.map((item) => ({
      key: item.key,
      productId: item.product_id,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      image: item.image,
      options: item.options ?? {},
      optionsValid: item.options_valid,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
      stock: item.stock,
    })),
    itemCount: quote.item_count,
    subtotal: Number(quote.subtotal),
    shipping: Number(quote.shipping),
    discount: Number(quote.discount),
    total: Number(quote.total),
    shippingMethod: quote.shipping_method,
    shippingOptions: quote.shipping_options.map((option) => ({ ...option, price: Number(option.price) })),
    coupon: quote.coupon && {
      code: quote.coupon.code,
      status: quote.coupon.status,
      minSubtotal: quote.coupon.min_subtotal === null ? null : Number(quote.coupon.min_subtotal),
    },
  };
}

// Without Supabase there is no checkout; this only lets the cart page show sample products.
function quoteSampleCatalog(items: CartItem[]): CartQuote {
  const lines = items.flatMap((item): CartLine[] => {
    const product = sampleProducts.find((candidate) => candidate.id === item.productId);
    return product
      ? [
          {
            key: item.key,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image: product.image,
            options: item.options,
            optionsValid: validateOptions(product.options, item.options).ok,
            unitPrice: product.price,
            quantity: item.quantity,
            lineTotal: product.price * item.quantity,
            stock: product.stock,
          },
        ]
      : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    shipping: 0,
    discount: 0,
    total: subtotal,
    shippingMethod: "standard",
    shippingOptions: [],
    coupon: null,
  };
}
