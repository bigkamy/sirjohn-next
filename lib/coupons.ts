import { formatPrice } from "@/lib/format";

/** Mirrors the statuses returned by quote_cart in the database. */
export type CouponStatus = "applied" | "invalid" | "not_started" | "expired" | "exhausted" | "below_minimum";

export function couponStatusMessage(status: CouponStatus, minSubtotal: number | null) {
  switch (status) {
    case "applied":
      return "Coupon applied.";
    case "not_started":
      return "This coupon isn't active yet.";
    case "expired":
      return "This coupon has expired.";
    case "exhausted":
      return "This coupon has reached its usage limit.";
    case "below_minimum":
      return `Spend at least ${formatPrice(minSubtotal ?? 0)} to use this coupon.`;
    default:
      return "This coupon code isn't valid.";
  }
}
