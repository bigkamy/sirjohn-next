"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireUser } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { formText, optionalPhoneSchema } from "@/lib/validation";

const profileSchema = z.object({
  firstName: z.string().min(1, { error: "Enter your first name." }).max(60),
  lastName: z.string().min(1, { error: "Enter your last name." }).max(60),
  phone: optionalPhoneSchema,
});

// Only name and phone are ever written. The database also restricts customers to these
// columns (see the profiles grants), so a crafted request can't change the role.
export async function updateProfile(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const values = {
    firstName: formText(formData, "firstName"),
    lastName: formText(formData, "lastName"),
    phone: formText(formData, "phone"),
  };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName, phone: parsed.data.phone || null })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update failed:", error.message);
    return { error: "We couldn't save your profile. Please try again.", values };
  }

  refresh();
  return { message: "Your profile has been updated.", values };
}
