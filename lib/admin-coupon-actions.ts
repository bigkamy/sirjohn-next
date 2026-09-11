"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { fromIndiaLocal } from "@/lib/admin/datetime";
import { logAdminError } from "@/lib/admin/log";
import { requirePermission } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { formText, isPositiveInteger, numberOrNaN } from "@/lib/validation";

const couponSchema = z
  .object({
    code: z.string().regex(/^[A-Z0-9][A-Z0-9_-]{2,31}$/, { error: "Use 3–32 letters, numbers, dashes, or underscores." }),
    description: z.string().max(200),
    discountType: z.enum(["percent", "fixed"], { error: "Choose a discount type." }),
    value: z.number({ error: "Enter the discount." }).gt(0, { error: "The discount must be more than zero." }).max(10000000),
    minSubtotal: z.number({ error: "Enter an amount, or 0 for no minimum." }).min(0).max(10000000),
    maxDiscount: z.number({ error: "Enter an amount or leave blank." }).gt(0).max(10000000).nullable(),
    usageLimit: z.number({ error: "Enter a whole number or leave blank." }).int().min(1).max(1000000).nullable(),
    startsAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
  })
  .refine((coupon) => coupon.discountType !== "percent" || coupon.value <= 100, { error: "A percentage can't be more than 100.", path: ["value"] })
  .refine((coupon) => !coupon.startsAt || !coupon.expiresAt || coupon.expiresAt > coupon.startsAt, {
    error: "The end must be after the start.",
    path: ["expiresAt"],
  });

const FIELDS = ["code", "description", "discountType", "value", "minSubtotal", "maxDiscount", "usageLimit", "startsAt", "expiresAt"];

export async function saveCoupon(_state: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("coupons.manage", "/admin/coupons");

  const idText = formText(formData, "id");
  const id = idText ? Number(idText) : null;
  if (id !== null && !isPositiveInteger(id)) {
    return { error: "This coupon could not be found." };
  }

  const values: Record<string, string> = Object.fromEntries(FIELDS.map((key) => [key, formText(formData, key)]));
  values.code = values.code.toUpperCase();
  values.isActive = formData.get("isActive") === "on" ? "on" : "";

  const startsAt = values.startsAt ? fromIndiaLocal(values.startsAt) : null;
  const expiresAt = values.expiresAt ? fromIndiaLocal(values.expiresAt) : null;
  const dateErrors: Record<string, string[]> = {};
  if (values.startsAt && !startsAt) dateErrors.startsAt = ["Enter a valid date and time."];
  if (values.expiresAt && !expiresAt) dateErrors.expiresAt = ["Enter a valid date and time."];

  const parsed = couponSchema.safeParse({
    code: values.code,
    description: values.description,
    discountType: values.discountType,
    value: numberOrNaN(values.value),
    minSubtotal: values.minSubtotal === "" ? 0 : numberOrNaN(values.minSubtotal),
    maxDiscount: values.maxDiscount === "" ? null : numberOrNaN(values.maxDiscount),
    usageLimit: values.usageLimit === "" ? null : numberOrNaN(values.usageLimit),
    startsAt,
    expiresAt,
  });
  if (!parsed.success || Object.keys(dateErrors).length > 0) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: { ...(parsed.success ? {} : z.flattenError(parsed.error).fieldErrors), ...dateErrors },
      values,
    };
  }

  const coupon = parsed.data;
  const row = {
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discountType,
    value: coupon.value,
    min_subtotal: coupon.minSubtotal,
    // A cap only makes sense for percentage discounts.
    max_discount: coupon.discountType === "percent" ? coupon.maxDiscount : null,
    usage_limit: coupon.usageLimit,
    starts_at: coupon.startsAt,
    expires_at: coupon.expiresAt,
    is_active: values.isActive === "on",
  };

  const supabase = await createClient();
  const { data, error } =
    id === null
      ? await supabase.from("coupons").insert(row).select("id").single()
      : await supabase.from("coupons").update(row).eq("id", id).select("id").maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { error: "Please check the highlighted fields.", fieldErrors: { code: ["Another coupon already uses this code."] }, values };
    }
    await logAdminError("coupon.save", "coupon", id === null ? null : String(id), error.message);
    return { error: "We couldn't save this coupon. Please try again.", values };
  }
  if (!data) {
    return { error: "This coupon could not be found.", values };
  }

  revalidatePath("/admin/coupons");
  return { message: id === null ? `Coupon ${coupon.code} created.` : `Coupon ${coupon.code} saved.` };
}

export async function setCouponActive(id: number, active: boolean): Promise<{ ok: boolean; message: string }> {
  await requirePermission("coupons.manage", "/admin/coupons");
  if (!isPositiveInteger(id) || typeof active !== "boolean") {
    return { ok: false, message: "This coupon could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("coupons").update({ is_active: active }).eq("id", id).select("code").maybeSingle();
  if (error || !data) {
    if (error) await logAdminError("coupon.active", "coupon", String(id), error.message);
    return { ok: false, message: "We couldn't update this coupon. Please try again." };
  }

  revalidatePath("/admin/coupons");
  return { ok: true, message: active ? `${data.code} is active.` : `${data.code} is switched off.` };
}

/** Past orders keep the code they used (orders.coupon_code is plain text). */
export async function deleteCoupon(id: number): Promise<{ ok: boolean; message: string }> {
  await requirePermission("coupons.manage", "/admin/coupons");
  if (!isPositiveInteger(id)) {
    return { ok: false, message: "This coupon could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("coupons").delete().eq("id", id).select("code").maybeSingle();
  if (error || !data) {
    if (error) await logAdminError("coupon.delete", "coupon", String(id), error.message);
    return { ok: false, message: "We couldn't delete this coupon. Please try again." };
  }

  revalidatePath("/admin/coupons");
  return { ok: true, message: `Deleted ${data.code}.` };
}
