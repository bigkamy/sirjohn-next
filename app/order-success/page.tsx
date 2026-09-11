import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetails } from "@/components/orders/order-details";
import { requireUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/format";
import { getOrder } from "@/lib/orders";

export const metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

export default async function Page({ searchParams }: PageProps<"/order-success">) {
  const { order: orderParam } = await searchParams;
  const orderNumber = typeof orderParam === "string" ? orderParam : "";

  await requireUser(`/order-success?order=${encodeURIComponent(orderNumber)}`);
  const order = orderNumber ? await getOrder(orderNumber) : null;
  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-700">✓</div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Order confirmed</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Thank you for your order!</h1>
        <p className="mt-4 text-lg text-slate-600">Your order has been placed successfully. You can follow its progress from your account at any time.</p>

        <div className="mt-8 rounded-[24px] bg-[#f7f9f7] p-5 text-left">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Order Number</span>
            <span className="font-semibold text-slate-900">#{order.orderNumber}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Total</span>
            <span className="font-semibold text-slate-900">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="mt-8 text-left">
          <OrderDetails order={order} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white">View Order</Link>
          <Link href="/shop" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">Continue Shopping</Link>
        </div>
      </div>
    </main>
  );
}
