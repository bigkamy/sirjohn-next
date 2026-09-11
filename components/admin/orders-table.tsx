import Link from "next/link";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/ui/badge";
import { numericCell, Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import type { AdminOrderRow } from "@/lib/admin-orders";
import { formatDate, formatPrice } from "@/lib/format";

export function OrdersTable({ orders, showCustomer = true }: { orders: AdminOrderRow[]; showCustomer?: boolean }) {
  return (
    <Table label="Orders">
      <THead>
        <Th>Order</Th>
        <Th className="hidden sm:table-cell">Date</Th>
        {showCustomer && <Th>Customer</Th>}
        <Th>Status</Th>
        <Th className="hidden md:table-cell">Payment</Th>
        <Th className="text-right">Total</Th>
      </THead>
      <TBody>
        {orders.map((order) => (
          <tr key={order.orderNumber} className="hover:bg-slate-50/70">
            <Td>
              <Link href={`/admin/orders/${encodeURIComponent(order.orderNumber)}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                #{order.orderNumber}
              </Link>
              <div className="text-xs text-slate-500">
                <span className="sm:hidden">{formatDate(order.createdAt)} · </span>
                {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </div>
            </Td>
            <Td className="hidden whitespace-nowrap sm:table-cell">{formatDate(order.createdAt)}</Td>
            {showCustomer && (
              <Td>
                <div className="max-w-[220px] truncate text-slate-900">{order.customerName}</div>
                <div className="max-w-[220px] truncate text-xs text-slate-500">{order.email}</div>
              </Td>
            )}
            <Td><OrderStatusBadge status={order.status} /></Td>
            <Td className="hidden md:table-cell"><PaymentStatusBadge status={order.paymentStatus} /></Td>
            <Td className={`${numericCell} font-medium text-slate-900`}>{formatPrice(order.total)}</Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}
