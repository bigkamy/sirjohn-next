import Link from "next/link";
import { AdminHeading, adminButtonClass, adminPrimaryButtonClass } from "@/components/admin/admin-heading";
import { OrdersTable } from "@/components/admin/orders-table";
import { RemoveSamplesButton } from "@/components/admin/remove-samples-button";
import { LOW_STOCK_THRESHOLD, type DashboardStats } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/format";
import type { ChecklistItem } from "@/lib/launch-checklist";
import type { AdminOrderSummary } from "@/lib/orders";

type AdminDashboardProps = {
  stats: DashboardStats;
  recentOrders: AdminOrderSummary[];
  checklist: ChecklistItem[];
};

export function AdminDashboard({ stats, recentOrders, checklist }: AdminDashboardProps) {
  const cards = [
    {
      label: "Revenue (paid)",
      value: formatPrice(stats.paidRevenue),
      detail: `${formatPrice(stats.orderValue)} across all orders placed`,
    },
    {
      label: "Total Orders",
      value: stats.orderCount.toLocaleString("en-IN"),
      detail: `${stats.ordersLast30Days} in the last 30 days`,
    },
    {
      label: "Customers",
      value: stats.customerCount.toLocaleString("en-IN"),
      detail: `${stats.newCustomersLast30Days} new in the last 30 days`,
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount.toLocaleString("en-IN"),
      detail: `${stats.outOfStockCount} out of stock · ${LOW_STOCK_THRESHOLD} or fewer units`,
      href: "/admin/products",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading title="Dashboard" description="Cancelled orders are excluded from these figures.">
        <Link href="/admin/orders" className={adminButtonClass}>Orders</Link>
        <Link href="/admin/categories" className={adminButtonClass}>Categories</Link>
        <Link href="/admin/shipping" className={adminButtonClass}>Shipping Settings</Link>
        <Link href="/admin/products" className={adminPrimaryButtonClass}>Manage Products</Link>
      </AdminHeading>

      {checklist.length > 0 && (
        <section aria-labelledby="launch-checklist" className="mb-8 rounded-[28px] border border-amber-200 bg-amber-50 p-6">
          <h2 id="launch-checklist" className="text-xl font-bold text-amber-950">Launch checklist</h2>
          <p className="mt-1 text-sm text-amber-900">These items still need attention before the store goes live.</p>
          <ul className="mt-4 space-y-3">
            {checklist.map((item) => (
              <li key={item.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                <div className="font-semibold text-slate-900">{item.title}</div>
                <p className="mt-1 text-slate-600">{item.detail}</p>
                {item.link && (
                  <Link href={item.link.href} className="mt-2 inline-block font-semibold text-emerald-700">
                    {item.link.label}
                  </Link>
                )}
                {item.sampleCount !== undefined && (
                  <div className="mt-3">
                    <RemoveSamplesButton count={item.sampleCount} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const content = (
            <>
              <div className="text-sm text-slate-500">{card.label}</div>
              <div className="mt-4 text-3xl font-black text-slate-900">{card.value}</div>
              <div className="mt-2 text-sm font-medium text-emerald-700">{card.detail}</div>
            </>
          );
          const className = "rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm";
          return card.href ? (
            <Link key={card.label} href={card.href} className={`${className} transition hover:border-emerald-300`}>
              {content}
            </Link>
          ) : (
            <div key={card.label} className={className}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-emerald-700">View all</Link>
        </div>
        <OrdersTable orders={recentOrders} />
      </div>
    </main>
  );
}
