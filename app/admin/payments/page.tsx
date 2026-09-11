import Link from "next/link";
import { CircleCheck, CircleX, Clock, RotateCcw } from "lucide-react";
import { OrdersTable } from "@/components/admin/orders-table";
import { PaymentStatusBadge } from "@/components/admin/ui/badge";
import { Card, CardHeader, EmptyState, Notice, PageHeader, StatCard, TextLink } from "@/components/admin/ui/primitives";
import { numericCell, Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import { listAdminOrders } from "@/lib/admin-orders";
import { getPaymentOverview } from "@/lib/admin-payments";
import { requirePermission } from "@/lib/auth/dal";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata = { title: "Payments" };

export default async function Page() {
  await requirePermission("payments.view", "/admin/payments");
  const [{ counts, payments }, awaiting] = await Promise.all([getPaymentOverview(), listAdminOrders({ payment: "pending", pageSize: 10 })]);

  return (
    <>
      <PageHeader title="Payments" description="Payment status of every order (cancelled orders excluded) and the records sent by your payment provider." />

      {payments.length === 0 && (
        <div className="mb-6">
          <Notice>
            No payment gateway is connected yet, so orders stay “awaiting payment” and no payment records exist. Once a gateway is added, confirmed payments
            are recorded here automatically and their orders move to processing.
          </Notice>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting payment" value={String(counts.pending)} href="/admin/orders?payment=pending" icon={<Clock size={18} />} />
        <StatCard label="Paid" value={String(counts.paid)} href="/admin/orders?payment=paid" icon={<CircleCheck size={18} />} />
        <StatCard label="Failed" value={String(counts.failed)} href="/admin/orders?payment=failed" icon={<CircleX size={18} />} />
        <StatCard label="Refunded" value={String(counts.refunded)} href="/admin/orders?payment=refunded" icon={<RotateCcw size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardHeader title="Payment records" description="The 50 most recent, as confirmed by the provider." />
          {payments.length === 0 ? (
            <EmptyState title="No payment records yet" />
          ) : (
            <Table label="Payment records">
              <THead>
                <Th>Order</Th>
                <Th>Provider</Th>
                <Th>Status</Th>
                <Th className="hidden md:table-cell">Date</Th>
                <Th className="text-right">Amount</Th>
              </THead>
              <TBody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <Td>
                      {payment.orderNumber ? (
                        <Link href={`/admin/orders/${encodeURIComponent(payment.orderNumber)}`} className="font-medium text-slate-900 hover:text-emerald-700">
                          #{payment.orderNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="capitalize">{payment.provider}</Td>
                    <Td><PaymentStatusBadge status={payment.status} /></Td>
                    <Td className="hidden whitespace-nowrap md:table-cell">{formatDateTime(payment.createdAt)}</Td>
                    <Td className={numericCell}>{formatPrice(payment.amount)}</Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Orders awaiting payment" action={awaiting.total > 10 ? <TextLink href="/admin/orders?payment=pending">All {awaiting.total}</TextLink> : undefined} />
          {awaiting.orders.length === 0 ? <EmptyState title="Nothing awaiting payment" /> : <OrdersTable orders={awaiting.orders} />}
        </Card>
      </div>
    </>
  );
}
