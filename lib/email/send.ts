import "server-only";

// Transactional email through Resend (https://resend.com).
//
// Server-side only: RESEND_API_KEY has no NEXT_PUBLIC_ prefix, so it never reaches the
// browser, and nothing here runs outside a Server Action or Route Handler. Called over
// fetch rather than the SDK to keep the dependency list short and to pass an
// Idempotency-Key, which stops a retried request producing a second email.

/** Values left unchanged from .env.example count as "not configured". */
const EXAMPLE_KEY = "re_your_api_key";
const EXAMPLE_FROM = "Store Name <orders@your-domain.com>";

const DEFAULT_ENDPOINT = "https://api.resend.com/emails";
const TIMEOUT_MS = 15000;

// Read at call time, so a key added to the environment is picked up without a rebuild.
const apiKey = () => (process.env.RESEND_API_KEY ?? "").trim();
const sender = () => (process.env.ORDER_EMAIL_FROM ?? "").trim();
const replyTo = () => (process.env.ORDER_EMAIL_REPLY_TO ?? "").trim();
const endpoint = () => (process.env.RESEND_API_URL ?? "").trim() || DEFAULT_ENDPOINT;

/** Whether email can be sent at all. Everything email-related is skipped while this is false. */
export function isEmailConfigured() {
  const key = apiKey();
  const from = sender();
  return Boolean(key && from && key !== EXAMPLE_KEY && from !== EXAMPLE_FROM);
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Same key for the same attempt, so a retry can't deliver twice. Max 256 characters. */
  idempotencyKey?: string;
};

/**
 * Hands one message to the provider. Never throws: the caller decides what a failure means,
 * and for an order confirmation it must never affect the order.
 */
export async function sendEmail({ to, subject, html, text, idempotencyKey }: EmailMessage): Promise<SendResult> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email sending is not configured." };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey.slice(0, 256);
  }

  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: sender(),
        to,
        subject,
        html,
        text,
        ...(replyTo() ? { reply_to: replyTo() } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const body = await response.text();
    if (!response.ok) {
      return { ok: false, error: providerError(response.status, body) };
    }

    let id = "";
    try {
      id = (JSON.parse(body) as { id?: string }).id ?? "";
    } catch {
      // Accepted, but the body wasn't the usual { id }. Not worth failing over.
    }
    return { ok: true, id };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    return { ok: false, error: `Could not reach the email provider: ${reason}` };
  }
}

/** The provider's own wording, trimmed for the activity log. Staff see it; customers never do. */
function providerError(status: number, body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string; name?: string; error?: string };
    const message = parsed.message ?? parsed.error ?? parsed.name;
    if (message) {
      return `${status}: ${message}`.slice(0, 280);
    }
  } catch {
    // Not JSON; fall through to the status line.
  }
  return `Email provider returned ${status}.`;
}
