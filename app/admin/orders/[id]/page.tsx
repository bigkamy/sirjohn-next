import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/ui/badge";
import { Card, CardHeader, DetailList, PageHeader } from "@/components/admin/ui/primitives";
import { getAdminOrder } from "@/lib/admin-orders";
import { requirePermission } from "@/lib/auth/dal";
import { paymentMethodLabels } from "@/lib/checkout";
import { formatDateTime, formatPrice } from "@/lib/format";
import { formatOptions } from "@/lib/product-options";

export const metadata = { title: "Order" };

// The segment is the order number (e.g. GOLF1001), which is what staff and customers quote.
export default async function Page({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const staff = await requirePermission("orders.view", `/admin/orders/${encodeURIComponent(id)}`);
  const order = await getAdminOrder(id);
  if (!order) {
    notFound();
  }

  const can = (permission: Parameters<typeof staff.permissions.has>[0]) => staff.permissions.has(permission);
  const address = order.shippingAddress;

  return (
    <>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Placed {formatDateTime(order.createdAt)} <OrderStatusBadge status={order.status} /> <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Items" description={`${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}`} />
            <ul className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 object-cover" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-100" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    {Object.keys(item.options).length > 0 && <p className="text-sm text-slate-600">{formatOptions(item.options)}</p>}
                    <p className="text-sm text-slate-500">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                      {!item.slug && " · product no longer in the catalog"}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-slate-900">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
              <div className="flex justify-between text-slate-600"><dt>Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between text-slate-600"><dt>Shipping ({order.shippingMethod})</dt><dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                  <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <ActivityFeed entries={order.activity} empty="No changes since the order was placed." />
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Order placed {formatDateTime(order.createdAt)}</p>
          </Card>
        </div>

        <div className="space-y-6">
          {can("orders.manage") && (
            <Card>
              <CardHeader title="Fulfilment" />
              <div className="p-5">
                <OrderStatusControl orderNumber={order.orderNumber} status={order.status} paymentStatus={order.paymentStatus} canCancel={can("orders.cancel")} />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Customer"
              action={
                order.userId && can("customers.view") ? (
                  <Link href={`/admin/customers/${order.userId}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
                    View customer
                  </Link>
                ) : undefined
              }
            />
            <DetailList
              items={[
                { label: "Name", value: address.fullName },
                { label: "Email", value: <a href={`mailto:${order.email}`} className="text-emerald-700">{order.email}</a> },
                { label: "Phone", value: address.phone },
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Shipping address" />
            <address className="px-5 py-4 text-sm not-italic leading-6 text-slate-700">
              {address.fullName}
              <br />
              {address.line1}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </address>
            <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-600">Method: {order.shippingMethod}</p>
          </Card>

          <Card>
            <CardHeader title="Payment" />
            <DetailList
              items={[
                { label: "Method", value: paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod },
                { label: "Status", value: <PaymentStatusBadge status={order.paymentStatus} /> },
                { label: "Amount due", value: formatPrice(order.total) },
              ]}
            />
            {order.payments !== null && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Payment records</p>
                {order.payments.length === 0 ? (
                  <p className="text-sm text-slate-500">None yet. Records appear here once a payment gateway confirms a payment.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {order.payments.map((payment) => (
                      <li key={payment.id} className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium capitalize text-slate-900">{payment.provider}</span>
                          <PaymentStatusBadge status={payment.status} />
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatPrice(payment.amount)} {payment.currency} · {formatDateTime(payment.createdAt)}
                        </p>
                        {payment.providerPaymentId && <p className="break-all font-mono text-xs text-slate-500">{payment.providerPaymentId}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
