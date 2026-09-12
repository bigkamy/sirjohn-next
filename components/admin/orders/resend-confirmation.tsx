"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { resendOrderConfirmation } from "@/lib/admin-email-actions";
import type { ConfirmationEmailStatus } from "@/lib/email/status";
import { NETWORK_ERROR } from "@/lib/messages";

/** The database allows one attempt a minute per order; the button matches it so the click is honest. */
const COOLDOWN_MS = 60_000;

export function ResendConfirmationEmail({
  orderNumber,
  email,
  status,
}: {
  orderNumber: string;
  email: string;
  status: ConfirmationEmailStatus;
}) {
  const toast = useToast();
  const [cooling, setCooling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startCooldown = () => {
    setCooling(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
  };

  return (
    <ConfirmButton
      tone="primary"
      className={buttonClass("secondary", "sm")}
      disabled={cooling}
      label={
        <>
          <Send size={13} aria-hidden /> {cooling ? "Just sent" : status === "sent" ? "Resend" : "Send now"}
        </>
      }
      ariaLabel={`Resend the confirmation email for order ${orderNumber}`}
      title={status === "sent" ? "Resend the confirmation email?" : "Send the confirmation email?"}
      description={
        <>
          A copy of the order confirmation goes to <strong>{email}</strong>. The customer sees no difference from the original.
        </>
      }
      confirmLabel="Send email"
      onConfirm={async () => {
        startCooldown();
        const result = await resendOrderConfirmation(orderNumber).catch(() => ({ ok: false, message: NETWORK_ERROR }));
        toast({ tone: result.ok ? "success" : "error", message: result.message });
      }}
    />
  );
}
