import Link from "next/link";
import { PriceRows } from "@/components/cart/price-rows";
import { paymentMethodLabels } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order-status";
import type { OrderDetail } from "@/lib/orders";
import { formatOptions } from "@/lib/product-options";

const pillClass = "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700";

export function OrderDetails({ order }: { order: OrderDetail }) {
  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f9f7] p-3">
              <div className="flex items-center gap-3">
                {item.image && <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />}
                <div>
                  <div className="font-semibold text-slate-900">
                    {item.slug ? (
                      <Link href={`/product/${item.slug}`} className="hover:text-emerald-700">{item.productName}</Link>
                    ) : (
                      item.productName
                    )}
                  </div>
                  {Object.keys(item.options).length > 0 && (
                    <div className="text-sm text-slate-600">{formatOptions(item.options)}</div>
                  )}
                  <div className="text-sm text-slate-500">
                    Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                  </div>
                </div>
              </div>
              <div className="font-semibold text-slate-700">{formatPrice(item.lineTotal)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
          <h3 className="mb-2 font-semibold text-slate-900">Delivery Address</h3>
          <p>{address.fullName}</p>
          <p>{address.line1}</p>
          <p>
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p>{address.country}</p>
          <p className="mt-2">{address.phone}</p>
          <p>{order.email}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
          <h3 className="mb-2 font-semibold text-slate-900">Shipping &amp; Payment</h3>
          <p>{order.shippingMethod}</p>
          <p>{paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            Order: <span className={pillClass}>{orderStatusLabel(order.status)}</span>
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            Payment: <span className={pillClass}>{paymentStatusLabel(order.paymentStatus)}</span>
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-slate-600">
        <PriceRows subtotal={order.subtotal} shipping={order.shipping} discount={order.discount} couponCode={order.couponCode} />
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-bold text-slate-900">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
