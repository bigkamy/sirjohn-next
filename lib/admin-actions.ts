"use server";

import { refresh, revalidatePath, revalidateTag } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import { invalidateCatalog } from "@/lib/revalidate-catalog";
import { SHIPPING_CACHE_TAG } from "@/lib/shipping";
import { createClient } from "@/lib/supabase/server";
import { formText, numberOrNaN } from "@/lib/validation";

const shippingSchema = z.object({
  name: z.string().min(2, { error: "Enter a name customers will see." }).max(60),
  description: z.string().max(120),
  price: z.number({ error: "Enter a price in rupees." }).min(0, { error: "Price can't be negative." }).max(100000),
  freeOver: z.number({ error: "Enter an amount or leave blank." }).min(0).max(10000000).nullable(),
});

const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;

const ORDER_STATUS_ERRORS: Record<string, string> = {
  order_closed: "Delivered or cancelled orders can't be changed.",
  order_shipped: "A shipped order can only be marked as delivered.",
  order_not_found: "This order no longer exists.",
};

/** Sets an order's status. Cancelling returns its items to stock (see admin_set_order_status). */
export async function updateOrderStatus(orderNumber: string, status: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin("/admin/orders");
  if (typeof orderNumber !== "string" || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, message: "Choose a valid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_order_status", { p_order_number: orderNumber, p_status: status });
  if (error) {
    const message = ORDER_STATUS_ERRORS[error.message];
    if (!message) console.error("Order status update failed:", error.message);
    return { ok: false, message: message ?? "We couldn't update this order. Please try again." };
  }

  if (status === "cancelled") {
    // Stock went back up, so storefront stock levels are stale.
    invalidateCatalog();
  } else {
    refresh();
  }
  return { ok: true, message: `Order marked as ${status}.` };
}

export async function updateShippingMethod(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/shipping");

  const code = formText(formData, "code");
  const isActive = formData.get("isActive") === "on";
  const values = {
    name: formText(formData, "name"),
    description: formText(formData, "description"),
    price: formText(formData, "price"),
    freeOver: formText(formData, "freeOver"),
  };

  const parsed = shippingSchema.safeParse({
    name: values.name,
    description: values.description,
    price: numberOrNaN(values.price),
    freeOver: values.freeOver === "" ? null : numberOrNaN(values.freeOver),
  });
  if (!parsed.success) {
    return { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();

  // Checkout needs at least one method to offer.
  if (!isActive) {
    const { count } = await supabase
      .from("shipping_methods")
      .select("code", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("code", code);
    if (!count) {
      return { error: "At least one shipping method must stay active.", values };
    }
  }

  const { data, error } = await supabase
    .from("shipping_methods")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      free_over: parsed.data.freeOver,
      is_active: isActive,
    })
    .eq("code", code)
    .select("code")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Shipping update failed:", error.message);
    return { error: "We couldn't save this shipping method.", values };
  }

  // Storefront copy ("Free shipping over …") is cached and prerendered; refresh both.
  revalidateTag(SHIPPING_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return { message: `${parsed.data.name} saved.`, values };
}
