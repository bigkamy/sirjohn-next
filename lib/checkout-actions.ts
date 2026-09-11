"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import * as z from "zod";
import { upsertAddress } from "@/lib/addresses";
import { requireUser } from "@/lib/auth/dal";
import { readCouponCode, writeCouponCode } from "@/lib/cart";
import { PAYMENT_METHODS } from "@/lib/checkout";
import { couponStatusMessage, type CouponStatus } from "@/lib/coupons";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { formText, phoneSchema, pinCodeSchema } from "@/lib/validation";

const checkoutSchema = z.object({
  firstName: z.string().min(1, { error: "Enter your first name." }).max(60),
  lastName: z.string().min(1, { error: "Enter your last name." }).max(60),
  email: z.email({ error: "Enter a valid email address." }),
  phone: phoneSchema,
  address: z.string().min(5, { error: "Enter your street address." }).max(200),
  city: z.string().min(2, { error: "Enter your city." }).max(80),
  state: z.string().min(2, { error: "Enter your state." }).max(80),
  pinCode: pinCodeSchema,
  shippingMethod: z.string().min(1, { error: "Choose a shipping method." }),
  paymentMethod: z.enum(PAYMENT_METHODS, { error: "Choose a payment method." }),
});

const FIELDS = Object.keys(checkoutSchema.shape) as (keyof typeof checkoutSchema.shape)[];

// Only delivery details come from the browser. Items, options, prices, shipping,
// discounts, and totals are all worked out inside place_order from the database.
export async function placeOrder(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/checkout");

  const values: Record<string, string> = Object.fromEntries(FIELDS.map((key) => [key, formText(formData, key)]));
  // Echoed back so the form stays on the address the customer picked.
  values.addressId = formText(formData, "addressId");

  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const details = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_email: details.email,
    p_shipping_address: {
      full_name: `${details.firstName} ${details.lastName}`,
      phone: details.phone,
      line1: details.address,
      city: details.city,
      state: details.state,
      postal_code: details.pinCode,
      country: "India",
    },
    p_shipping_method: details.shippingMethod,
    p_payment_method: details.paymentMethod,
    p_coupon_code: await readCouponCode(),
  });

  if (error) {
    if (error.message === "invalid_coupon") {
      // Drop the stale coupon so the refreshed page shows the real total.
      await writeCouponCode(null);
      const reason = couponStatusMessage((error.details || "invalid") as CouponStatus, null);
      return {
        error: `Your coupon was removed: ${reason} Please review your total and place the order again.`,
        values,
      };
    }
    return { error: orderErrorMessage(error), values };
  }

  await writeCouponCode(null);

  if (formData.get("saveAddress") === "on") {
    await upsertAddress(user.id, {
      label: "Home",
      fullName: `${details.firstName} ${details.lastName}`,
      phone: details.phone,
      line1: details.address,
      line2: "",
      city: details.city,
      state: details.state,
      postalCode: details.pinCode,
    });
  }

  redirect(`/order-success?order=${encodeURIComponent(data.order_number)}`);
}

function orderErrorMessage(error: PostgrestError) {
  switch (error.message) {
    case "cart_empty":
      return "Your cart is empty.";
    case "insufficient_stock": {
      try {
        const { name, available } = JSON.parse(error.details) as { name: string; available: number };
        return available > 0
          ? `Only ${available} × ${name} left in stock. Please update your cart.`
          : `${name} is no longer available. Please remove it from your cart.`;
      } catch {
        return "Some items in your cart are no longer available. Please review your cart.";
      }
    }
    case "invalid_options":
      return `The options chosen for ${error.details} are no longer offered. Please remove it from your cart and add it again.`;
    case "invalid_shipping_method":
      return "Please choose a valid shipping method.";
    case "invalid_payment_method":
    case "invalid_address":
      return "Please check your delivery and payment details.";
    default:
      console.error("Place order failed:", error);
      return "We couldn't place your order. Please try again.";
  }
}
