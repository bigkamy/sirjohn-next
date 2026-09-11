import Link from "next/link";
import { AccountLayout } from "@/components/account/account-layout";
import { FormAlert } from "@/components/auth/form-controls";
import { NoOrders, OrderSummaryRow } from "@/components/orders/order-summary-row";
import { getAccountOverview } from "@/lib/account";
import { requireUser } from "@/lib/auth/dal";

export default async function Page({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const [overview, { password }] = await Promise.all([getAccountOverview(), searchParams]);

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        {password === "updated" && <FormAlert message="Your password has been updated." />}

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Account overview</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
            Welcome back{user.profile.firstName ? `, ${user.profile.firstName}` : ""}
          </h1>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { label: "Total Orders", value: overview.orderCount },
            { label: "Wishlist Items", value: overview.wishlistCount },
            { label: "Saved Addresses", value: overview.addressCount },
          ].map((card) => (
            <div key={card.label} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">{card.label}</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{String(card.value).padStart(2, "0")}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
            {overview.orderCount > 0 && (
              <Link href="/account/orders" className="text-sm font-semibold text-emerald-700">View all</Link>
            )}
          </div>
          <div className="mt-5 space-y-4">
            {overview.recentOrders.length === 0 ? (
              <NoOrders />
            ) : (
              overview.recentOrders.map((order) => <OrderSummaryRow key={order.orderNumber} order={order} />)
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
