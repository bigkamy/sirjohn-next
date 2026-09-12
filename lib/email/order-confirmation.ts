import "server-only";
import { fetchOrderDetail } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { orderConfirmationEmail } from "./order-confirmation-template";
import { isEmailConfigured, sendEmail } from "./send";

/**
 * Sends the one confirmation email for an order.
 *
 * The database hands out the claim (claim_order_confirmation_email), so this is safe to call
 * more than once: only the first call for an order actually sends. It never throws — a
 * confirmation email is not allowed to affect an order that has already been placed.
 */
export type ConfirmationOutcome =
  | "sent"
  | "not_configured"
  | "already_sent"
  | "in_progress"
  | "too_soon"
  | "not_authorized"
  | "order_not_found"
  | "send_failed"
  | "error";

export type ConfirmationResult = { outcome: ConfirmationOutcome; error?: string };

type Claim = { order_id: string; order_number: string; attempt: number; resent: boolean };

// Errors raised by claim_order_confirmation_email.
const CLAIM_OUTCOMES: Record<string, ConfirmationOutcome> = {
  email_already_sent: "already_sent",
  email_in_progress: "in_progress",
  email_too_soon: "too_soon",
  not_authorized: "not_authorized",
  not_authenticated: "not_authorized",
  order_not_found: "order_not_found",
};

export async function sendOrderConfirmation(orderNumber: string, { force = false } = {}): Promise<ConfirmationResult> {
  if (!isEmailConfigured()) {
    // The order stands; the admin panel and system health both show that email sending is not set up.
    console.warn(`Order ${orderNumber}: confirmation email skipped, email sending is not configured.`);
    return { outcome: "not_configured" };
  }

  const supabase = await createClient();
  let claim: Claim | null = null;

  try {
    const { data, error } = await supabase.rpc("claim_order_confirmation_email", {
      p_order_number: orderNumber,
      p_force: force,
    });

    if (error) {
      const outcome = CLAIM_OUTCOMES[error.message];
      if (!outcome) {
        console.error(`Order ${orderNumber}: could not claim the confirmation email:`, error.message);
        return { outcome: "error", error: error.message };
      }
      return { outcome };
    }

    claim = data as Claim;

    // RLS keeps this to the caller's own order unless they hold orders.view.
    const order = await fetchOrderDetail(orderNumber, null);
    if (!order) {
      await record(supabase, claim.order_id, false, "The order could not be read.");
      return { outcome: "order_not_found" };
    }

    const { subject, html, text } = orderConfirmationEmail(order);
    const result = await sendEmail({
      to: order.email,
      subject,
      html,
      text,
      // Per attempt, so a retried request can't deliver twice but a resend still can.
      idempotencyKey: `order-confirmation:${claim.order_id}:${claim.attempt}`,
    });

    await record(supabase, claim.order_id, result.ok, result.ok ? null : result.error);

    if (!result.ok) {
      console.error(`Order ${orderNumber}: confirmation email failed:`, result.error);
      return { outcome: "send_failed", error: result.error };
    }
    return { outcome: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`Order ${orderNumber}: confirmation email failed:`, message);
    if (claim) {
      // Don't leave the order stuck on "sending".
      await record(supabase, claim.order_id, false, message);
    }
    return { outcome: "error", error: message };
  }
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function record(supabase: ServerClient, orderId: string, ok: boolean, error: string | null) {
  const { error: recordError } = await supabase.rpc("record_order_confirmation_email", {
    p_order_id: orderId,
    p_ok: ok,
    p_error: error,
  });
  if (recordError) {
    console.error(`Could not record the confirmation email result for order ${orderId}:`, recordError.message);
  }
}
