import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import type { AdminOrderSummary } from "@/lib/orders";

export function OrdersTable({ orders }: { orders: AdminOrderSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-left text-sm text-slate-600">
        <thead className="bg-[#f7f9f7] text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Payment</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr className="border-t border-slate-200">
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No orders yet.</td>
            </tr>
          )}
          {orders.map((order) => (
            <tr key={order.orderNumber} className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link href={`/admin/orders/${encodeURIComponent(order.orderNumber)}`} className="hover:text-emerald-700">
                  #{order.orderNumber}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="text-slate-900">{order.customerName}</div>
                <div className="text-xs text-slate-500">{order.email}</div>
              </td>
              <td className="px-4 py-3">{formatPrice(order.total)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">{order.status}</span>
              </td>
              <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{order.paymentStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
