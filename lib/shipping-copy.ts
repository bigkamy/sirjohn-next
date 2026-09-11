import { formatPrice } from "@/lib/format";

/** Storefront wording for the free-shipping threshold configured in shipping_methods. */
export function freeShippingLabel(threshold: number | null) {
  return threshold === null ? "Shipping calculated at checkout" : `Free shipping over ${formatPrice(threshold)}`;
}
