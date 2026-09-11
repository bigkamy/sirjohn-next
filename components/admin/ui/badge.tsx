import type { ReactNode } from "react";
import { ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order-status";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "violet";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
};

/** A status pill. The text always names the state, so colour never carries it alone. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

const ORDER_TONES: Record<string, BadgeTone> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "violet",
  delivered: "success",
  cancelled: "neutral",
  refunded: "danger",
};

const PAYMENT_TONES: Record<string, BadgeTone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge tone={ORDER_TONES[status] ?? "neutral"}>{orderStatusLabel(status)}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge tone={PAYMENT_TONES[status] ?? "neutral"}>{paymentStatusLabel(status)}</Badge>;
}

export type StockState = "in_stock" | "low_stock" | "out_of_stock";

export function stockState(stock: number, threshold: number): StockState {
  if (stock <= 0) return "out_of_stock";
  return stock <= threshold ? "low_stock" : "in_stock";
}

export function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  const state = stockState(stock, threshold);
  if (state === "out_of_stock") return <Badge tone="danger">Out of stock</Badge>;
  if (state === "low_stock") return <Badge tone="warning">Low stock</Badge>;
  return <Badge tone="success">In stock</Badge>;
}

export function VisibilityBadge({ active }: { active: boolean }) {
  return active ? <Badge tone="success">Visible</Badge> : <Badge>Hidden</Badge>;
}

const REVIEW_TONES: Record<string, BadgeTone> = { pending: "warning", approved: "success", rejected: "neutral" };
const REVIEW_LABELS: Record<string, string> = { pending: "Pending", approved: "Published", rejected: "Rejected" };

export function ReviewStatusBadge({ status }: { status: string }) {
  return <Badge tone={REVIEW_TONES[status] ?? "neutral"}>{REVIEW_LABELS[status] ?? status}</Badge>;
}

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  super_admin: "violet",
  admin: "info",
  manager: "success",
  staff: "neutral",
  customer: "neutral",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge tone={ROLE_TONES[role]}>{ROLE_LABELS[role]}</Badge>;
}
