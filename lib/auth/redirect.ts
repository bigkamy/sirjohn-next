/** Only allow same-site relative paths, so `?next=` can't bounce users to another origin. */
export function safeRedirectPath(value: unknown, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
