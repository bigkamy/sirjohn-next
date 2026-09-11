"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { upsertAddress } from "@/lib/addresses";
import { requireUser } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { formText, isUuid, phoneSchema, pinCodeSchema } from "@/lib/validation";

const addressSchema = z.object({
  label: z.string().min(1, { error: "Give this address a label, e.g. Home." }).max(40),
  fullName: z.string().min(2, { error: "Enter the recipient's full name." }).max(120),
  phone: phoneSchema,
  line1: z.string().min(5, { error: "Enter the street address." }).max(200),
  line2: z.string().max(200),
  city: z.string().min(2, { error: "Enter the city." }).max(80),
  state: z.string().min(2, { error: "Enter the state." }).max(80),
  postalCode: pinCodeSchema,
});

const FIELDS = Object.keys(addressSchema.shape) as (keyof typeof addressSchema.shape)[];

export async function saveAddress(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  const id = formText(formData, "id");
  const values = Object.fromEntries(FIELDS.map((key) => [key, formText(formData, key)]));

  if (id && !isUuid(id)) {
    return { error: "This address could not be found.", values };
  }

  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const saved = await upsertAddress(user.id, parsed.data, {
    id: id || undefined,
    makeDefault: formData.get("isDefault") === "on",
  });
  if (!saved) {
    return { error: "We couldn't save this address. Please try again.", values };
  }

  redirect("/account/addresses?saved=1");
}

export async function deleteAddress(id: string) {
  const user = await requireUser("/account/addresses");
  if (!isUuid(id)) {
    return;
  }

  const supabase = await createClient();
  const { data: removed } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("is_default")
    .maybeSingle();

  // Keep a default whenever the customer still has addresses.
  if (removed?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.rpc("set_default_address", { p_address_id: next.id });
    }
  }

  refresh();
}

export async function setDefaultAddress(id: string) {
  await requireUser("/account/addresses");
  if (!isUuid(id)) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_default_address", { p_address_id: id });
  if (error) {
    console.error("Setting default address failed:", error.message);
  }
  refresh();
}
