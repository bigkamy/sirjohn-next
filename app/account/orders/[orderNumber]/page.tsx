import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountLayout } from "@/components/account/account-layout";
import { OrderDetails } from "@/components/orders/order-details";
import { requireUser } from "@/lib/auth/dal";
import { formatDate } from "@/lib/format";
import { getOrder } from "@/lib/orders";

export const metadata = { title: "Order Details" };

export default async function Page({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const user = await requireUser(`/account/orders/${encodeURIComponent(orderNumber)}`);
  const order = await getOrder(orderNumber);
  if (!order) {
    notFound();
  }

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Link href="/account/orders" className="text-sm font-medium text-emerald-700">← Back to orders</Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Order details</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">#{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <OrderDetails order={order} />
        </div>
      </div>
    </AccountLayout>
  );
}
