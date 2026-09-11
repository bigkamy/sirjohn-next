// Order and payment statuses, shared by the customer account and the admin panel.

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/**
 * Where an order can go next. Mirrors admin_set_order_status, which enforces it: cancelling is
 * for unpaid orders, refunding for paid ones, and cancelled or refunded orders are final.
 */
export const NEXT_ORDER_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "processing", "shipped", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function orderStatusLabel(status: string) {
  return isOrderStatus(status) ? ORDER_STATUS_LABELS[status] : status;
}

export function paymentStatusLabel(status: string) {
  return isPaymentStatus(status) ? PAYMENT_STATUS_LABELS[status] : status;
}
