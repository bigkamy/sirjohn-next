import * as z from "zod";
import { supabaseUrl } from "@/lib/supabase/env";

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;
// Files in the media library, which is served over plain http by a local Supabase.
const MEDIA_URL_PREFIX = supabaseUrl ? `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/` : null;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const phoneSchema = z.string().regex(PHONE_PATTERN, { error: "Enter a valid phone number." });

export const optionalPhoneSchema = z
  .string()
  .refine((value) => value === "" || PHONE_PATTERN.test(value), { error: "Enter a valid phone number." });

/** A full https:// URL, a media library file, or a path to a file in /public such as /images/driver.jpg. */
export const imageUrlSchema = z
  .string()
  .refine((value) => /^(https:\/\/\S+|\/\S+)$/.test(value) || (MEDIA_URL_PREFIX !== null && value.startsWith(MEDIA_URL_PREFIX) && !/\s/.test(value)), {
    error: "Use a full https:// address, or a path to a file in /public such as /images/driver.jpg.",
  });

/**
 * A link a staff member may point a button at: a path on this site, or a full https address.
 * Refuses javascript: and data: URLs, protocol-relative "//host" links, and anything with
 * whitespace. is_safe_link in the database enforces the same rule.
 */
export const linkUrlSchema = z.string().refine((value) => /^\/([^/\s]\S*)?$/.test(value) || /^https:\/\/[^\s/]+(\/\S*)?$/.test(value), {
  error: "Use a path on this site such as /shop, or a full https:// address.",
});

export const isExternalLink = (url: string) => url.startsWith("https://");

export const pinCodeSchema =z.string().regex(/^[1-9][0-9]{5}$/, { error: "Enter a valid 6-digit PIN code." });

/** Parses a numeric form field; blank becomes NaN so schemas can reject it. */
export const numberOrNaN = (value: string) => (value === "" ? Number.NaN : Number(value));

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** A trimmed text field from a form submission ("" when missing). */
export function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
