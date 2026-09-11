"use server";

import * as z from "zod";
import type { FormState } from "@/lib/form-state";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { formText, optionalPhoneSchema } from "@/lib/validation";

const emailSchema = z.email({ error: "Enter a valid email address." }).max(254);

export async function subscribeToNewsletter(_state: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").toLowerCase();
  const values = { email };

  if (!emailSchema.safeParse(email).success) {
    return { error: "Enter a valid email address.", values };
  }
  if (!isSupabaseConfigured()) {
    return { error: "Sign-ups are unavailable right now. Please try again later.", values };
  }

  const { error } = await createPublicClient().rpc("subscribe_newsletter", { p_email: email });
  if (error) {
    console.error("Newsletter sign-up failed:", error.message);
    return { error: "We couldn't sign you up. Please try again.", values };
  }

  return { message: "Thanks — you're on the list." };
}

const contactSchema = z.object({
  name: z.string().min(1, { error: "Enter your name." }).max(120),
  email: emailSchema,
  phone: optionalPhoneSchema,
  subject: z.string().min(1, { error: "Enter a subject." }).max(150),
  message: z
    .string()
    .min(10, { error: "Tell us a little more (at least 10 characters)." })
    .max(5000, { error: "Please keep your message under 5,000 characters." }),
});

export async function sendContactMessage(_state: FormState, formData: FormData): Promise<FormState> {
  const values = {
    name: formText(formData, "name"),
    email: formText(formData, "email"),
    phone: formText(formData, "phone"),
    subject: formText(formData, "subject"),
    message: formText(formData, "message"),
  };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  if (!isSupabaseConfigured()) {
    return { error: "Messages can't be sent right now. Please email us instead.", values };
  }

  // The session-aware client links the message to the customer when they're signed in.
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_subject: parsed.data.subject,
    p_message: parsed.data.message,
  });
  if (error) {
    console.error("Contact message failed:", error.message);
    return { error: "We couldn't send your message. Please try again.", values };
  }

  return { message: "Thanks for getting in touch — your message has been sent." };
}
