"use client";

import { useState, useTransition } from "react";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { Checkbox } from "@/components/admin/ui/fields";
import { buttonClass, inputClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { updateOrderStatus } from "@/lib/admin-actions";
import { NETWORK_ERROR } from "@/lib/messages";
import { isOrderStatus, NEXT_ORDER_STATUSES, ORDER_STATUS_LABELS, orderStatusLabel, type OrderStatus } from "@/lib/order-status";

type Props = { orderNumber: string; status: string; paymentStatus: string; canCancel: boolean };

// Offers only the moves admin_set_order_status allows; the database enforces them regardless.
export function OrderStatusControl({ orderNumber, status, paymentStatus, canCancel }: Props) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const paid = paymentStatus === "paid";
  const allowed = isOrderStatus(status) ? NEXT_ORDER_STATUSES[status] : [];
  const forward: OrderStatus[] = allowed.filter((next) => next !== "cancelled" && next !== "refunded");
  const canCancelHere = canCancel && allowed.includes("cancelled") && !paid;
  const canRefundHere = canCancel && allowed.includes("refunded") && paid;
  const [choice, setChoice] = useState<OrderStatus | "">(forward[0] ?? "");
  // After an update the allowed statuses change; fall back to the first valid one.
  const next = choice && forward.includes(choice) ? choice : (forward[0] ?? "");

  async function apply(target: OrderStatus, restock = true) {
    const result = await updateOrderStatus(orderNumber, target, restock).catch(() => ({ ok: false, message: NETWORK_ERROR }));
    toast({ tone: result.ok ? "success" : "error", message: result.message });
  }

  if (forward.length === 0 && !canCancelHere && !canRefundHere) {
    return <p className="text-sm text-slate-500">This order is {orderStatusLabel(status).toLowerCase()} and can no longer be changed{allowed.length > 0 && !canCancel ? " by your role" : ""}.</p>;
  }

  return (
    <div className="space-y-4">
      {forward.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label htmlFor="order-status" className="mb-1.5 block text-sm font-medium text-slate-700">Change status to</label>
            <select id="order-status" value={next} onChange={(event) => setChoice(event.target.value as OrderStatus)} className={inputClass}>
              {forward.map((option) => (
                <option key={option} value={option}>{ORDER_STATUS_LABELS[option]}</option>
              ))}
            </select>
          </div>
          <button type="button" disabled={pending || !next} onClick={() => next && startTransition(() => apply(next))} className={buttonClass("primary")}>
            {pending ? "Updating…" : "Update Status"}
          </button>
        </div>
      )}

      {(canCancelHere || canRefundHere) && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {canCancelHere && (
            <ConfirmButton
              label="Cancel order"
              title={`Cancel order #${orderNumber}?`}
              description="Its items go back into stock and any coupon use is returned. The customer isn't notified automatically."
              confirmLabel="Cancel order"
              onConfirm={() => apply("cancelled")}
            />
          )}
          {canRefundHere && (
            <ConfirmButton
              label="Mark as refunded"
              title={`Mark order #${orderNumber} as refunded?`}
              description="This records the refund. It doesn't move any money — refund the customer through your payment provider first."
              confirmLabel="Mark as refunded"
              onConfirm={(formData) => apply("refunded", formData.get("restock") === "on")}
            >
              <Checkbox name="restock" label="Return the items to stock" description="Leave unticked if the goods weren't returned." defaultChecked />
            </ConfirmButton>
          )}
        </div>
      )}
      {!canCancel && allowed.some((option) => option === "cancelled" || option === "refunded") && (
        <p className="text-xs text-slate-500">Cancelling and refunding need a manager or admin.</p>
      )}
    </div>
  );
}
