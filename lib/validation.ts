import * as z from "zod";

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const phoneSchema = z.string().regex(PHONE_PATTERN, { error: "Enter a valid phone number." });

export const optionalPhoneSchema = z
  .string()
  .refine((value) => value === "" || PHONE_PATTERN.test(value), { error: "Enter a valid phone number." });

/** A full https:// URL, or a path to a file in /public such as /images/driver.jpg. */
export const imageUrlSchema = z
  .string()
  .regex(/^(https:\/\/\S+|\/\S+)$/, { error: "Use a full https:// address, or a path to a file in /public such as /images/driver.jpg." });

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
