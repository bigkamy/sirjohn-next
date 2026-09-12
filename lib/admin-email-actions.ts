"use server";

import { refresh } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { sendOrderConfirmation, type ConfirmationOutcome } from "@/lib/email/order-confirmation";

// Staff-facing wording for each outcome. The provider's own error is never repeated here;
// it is recorded on the order and in the activity log instead.
const MESSAGES: Record<ConfirmationOutcome, string> = {
  sent: "Confirmation email sent to the customer.",
  not_configured: "Email sending isn't set up yet. Add RESEND_API_KEY and ORDER_EMAIL_FROM to the server environment.",
  already_sent: "This confirmation email has already been sent.",
  in_progress: "A confirmation email for this order is being sent right now.",
  too_soon: "A confirmation email was just attempted for this order. Please wait a minute and try again.",
  not_authorized: "Your role can't resend this email.",
  order_not_found: "This order no longer exists.",
  send_failed: "The email provider wouldn't accept the message. The reason is recorded on this order.",
  error: "We couldn't send this email. Please try again.",
};

/**
 * Resends an order's confirmation email. Needs orders.manage, which the database checks again
 * inside claim_order_confirmation_email, and which no customer has. The same function enforces
 * one attempt a minute per order, so repeated clicks can't flood the customer.
 */
export async function resendOrderConfirmation(orderNumber: string): Promise<{ ok: boolean; message: string }> {
  await requirePermission("orders.manage", `/admin/orders/${encodeURIComponent(String(orderNumber))}`);

  if (typeof orderNumber !== "string" || orderNumber.length === 0 || orderNumber.length > 40) {
    return { ok: false, message: "That order number isn't valid." };
  }

  const { outcome } = await sendOrderConfirmation(orderNumber, { force: true });
  refresh();
  return { ok: outcome === "sent", message: MESSAGES[outcome] };
}
