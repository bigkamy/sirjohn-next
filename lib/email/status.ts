// Delivery state of an order's confirmation email, mirroring the columns added to orders in
// 20260917000000_order_confirmation_email.sql. Shared by the admin panel and its badges.

export const CONFIRMATION_EMAIL_STATUSES = ["pending", "sending", "sent", "failed"] as const;

export type ConfirmationEmailStatus = (typeof CONFIRMATION_EMAIL_STATUSES)[number];

export const CONFIRMATION_EMAIL_LABELS: Record<ConfirmationEmailStatus, string> = {
  pending: "Not sent",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
};

export function isConfirmationEmailStatus(value: unknown): value is ConfirmationEmailStatus {
  return typeof value === "string" && (CONFIRMATION_EMAIL_STATUSES as readonly string[]).includes(value);
}

export function confirmationEmailStatus(value: unknown): ConfirmationEmailStatus {
  return isConfirmationEmailStatus(value) ? value : "pending";
}

export type ConfirmationEmailState = {
  status: ConfirmationEmailStatus;
  sentAt: string | null;
  /** The provider's own words, for staff only. Never shown to a customer. */
  error: string | null;
  attempts: number;
  lastAttemptAt: string | null;
};
