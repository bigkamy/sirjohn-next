"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { requireUser } from "@/lib/auth/dal";
import { mergeGuestCart } from "@/lib/cart";
import { safeRedirectPath } from "@/lib/auth/redirect";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type FormState,
} from "@/lib/auth/schemas";
import { siteUrl } from "@/lib/site-url";
import { isSupabaseConfigured, notConfiguredMessage } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";
const WEAK_PASSWORD = "Choose a stronger password: at least 8 characters, with letters and numbers.";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

// Passwords are read verbatim — leading/trailing spaces are part of the secret.
function secret(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || (await headers()).get("origin") || siteUrl;
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };

  if (!isSupabaseConfigured()) {
    return { error: notConfiguredMessage, values };
  }

  const parsed = loginSchema.safeParse({ ...values, password: secret(formData, "password") });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Please confirm your email address before logging in.", values };
    }
    if (error.code === "over_request_rate_limit") {
      return { error: RATE_LIMITED, values };
    }
    return { error: "Incorrect email or password.", values };
  }

  await mergeGuestCart(supabase);
  redirect(safeRedirectPath(formData.get("next")));
}

export async function register(_state: FormState, formData: FormData): Promise<FormState> {
  const values = {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
  };

  if (!isSupabaseConfigured()) {
    return { error: notConfiguredMessage, values };
  }

  const parsed = registerSchema.safeParse({
    ...values,
    password: secret(formData, "password"),
    confirmPassword: secret(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  const next = safeRedirectPath(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Picked up by the handle_new_user trigger to create the profile row.
      data: { first_name: firstName, last_name: lastName, phone },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    switch (error.code) {
      case "user_already_exists":
      case "email_exists":
        return { error: "An account with this email already exists. Try logging in instead.", values };
      case "weak_password":
        return { error: WEAK_PASSWORD, values };
      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        return { error: RATE_LIMITED, values };
      default:
        console.error("Sign-up failed:", error);
        return { error: "We couldn't create your account. Please try again.", values };
    }
  }

  // With email confirmation on (Supabase's default) there is no session until the link is opened.
  if (!data.session) {
    return { message: `We've sent a confirmation link to ${email}. Open it to activate your account.` };
  }

  await mergeGuestCart(supabase);
  redirect(next);
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function requestPasswordReset(_state: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };

  if (!isSupabaseConfigured()) {
    return { error: notConfiguredMessage, values };
  }

  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/account/reset-password`,
  });

  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { error: RATE_LIMITED, values };
  }
  if (error) {
    console.error("Password reset request failed:", error);
  }

  // Same answer whether or not the account exists, so this form can't be used to probe emails.
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_state: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/account/reset-password");

  const parsed = resetPasswordSchema.safeParse({
    password: secret(formData, "password"),
    confirmPassword: secret(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    if (error.code === "same_password") {
      return { error: "Choose a password different from your current one." };
    }
    if (error.code === "weak_password") {
      return { error: WEAK_PASSWORD };
    }
    console.error("Password update failed:", error);
    return { error: "We couldn't update your password. Please try again." };
  }

  redirect("/account?password=updated");
}
