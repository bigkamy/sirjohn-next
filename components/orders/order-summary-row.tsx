import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-status";
import type { OrderSummary } from "@/lib/orders";

export function OrderSummaryRow({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
      className="flex flex-col gap-3 rounded-2xl bg-[#faf8f5] p-4 transition hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div className="font-semibold text-slate-900">#{order.orderNumber}</div>
        <div className="text-sm text-slate-500">
          Placed {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">{orderStatusLabel(order.status)}</span>
        <span className="font-semibold text-slate-900">{formatPrice(order.total)}</span>
      </div>
    </Link>
  );
}

export function NoOrders() {
  return (
    <p className="rounded-2xl bg-[#faf8f5] p-4 text-sm text-slate-600">
      You haven’t placed any orders yet.{" "}
      <Link href="/shop" className="font-semibold text-brand-700">Browse the shop</Link>
    </p>
  );
}
