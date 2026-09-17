import { AccountLayout } from "@/components/account/account-layout";
import { NoOrders, OrderSummaryRow } from "@/components/orders/order-summary-row";
import { requireUser } from "@/lib/auth/dal";
import { listOrders } from "@/lib/orders";

export const metadata = { title: "My Orders" };

export default async function Page() {
  const user = await requireUser("/account/orders");
  const orders = await listOrders();

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Order history</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">My Orders</h1>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {orders.length === 0 ? <NoOrders /> : orders.map((order) => <OrderSummaryRow key={order.orderNumber} order={order} />)}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
