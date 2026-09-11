import {
  Boxes,
  CalendarClock,
  Clock,
  IndianRupee,
  Loader,
  Package,
  ReceiptText,
  ShoppingBag,
  UserPlus,
  Users,
} from "lucide-react";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { LaunchChecklistCard, LowStockList, RecentCustomers } from "@/components/admin/dashboard/dashboard-sections";
import { OrdersTable } from "@/components/admin/orders-table";
import { Card, CardHeader, EmptyState, Notice, PageHeader, StatCard, TextLink } from "@/components/admin/ui/primitives";
import { listActivity } from "@/lib/admin-activity";
import { listCustomers } from "@/lib/admin-customers";
import { listLowStockProducts } from "@/lib/admin-inventory";
import { listAdminOrders } from "@/lib/admin-orders";
import { getDashboardStats } from "@/lib/admin-stats";
import { sectionForPermission } from "@/lib/admin/nav";
import { requirePermission } from "@/lib/auth/dal";
import type { Permission } from "@/lib/auth/roles";
import { formatPrice } from "@/lib/format";
import { getLaunchChecklist } from "@/lib/launch-checklist";

export const metadata = { title: "Dashboard" };

const count = (value: number) => value.toLocaleString("en-IN");

export default async function Page({ searchParams }: PageProps<"/admin">) {
  const staff = await requirePermission("dashboard.view", "/admin");
  const can = (permission: Permission) => staff.permissions.has(permission);
  const { denied } = await searchParams;
  const showActivity = can("security.view") || can("staff.manage");

  const [stats, recentOrders, recentCustomers, lowStock, activity, checklist] = await Promise.all([
    getDashboardStats(),
    can("orders.view") ? listAdminOrders({ pageSize: 6 }).then((result) => result.orders) : Promise.resolve([]),
    can("customers.view") ? listCustomers({ pageSize: 5 }).then((result) => result.customers) : Promise.resolve([]),
    listLowStockProducts(6),
    showActivity ? listActivity({ limit: 8 }) : Promise.resolve([]),
    can("settings.manage") ? getLaunchChecklist() : Promise.resolve([]),
  ]);

  const firstName = staff.user.profile.firstName;
  const deniedSection = typeof denied === "string" ? sectionForPermission(denied) : null;

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description="Live figures from your store database. Cancelled orders are left out of order totals."
      />

      {typeof denied === "string" && (
        <div className="mb-6">
          <Notice tone="warning">
            You don&apos;t have access to {deniedSection ?? "that section"}. Ask a super admin if you need it.
          </Notice>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.paidRevenue !== null && (
          <StatCard label="Revenue (paid)" value={formatPrice(stats.paidRevenue)} detail="Orders with a confirmed payment" icon={<IndianRupee size={18} />} />
        )}
        {stats.orderValue !== null && (
          <StatCard label="Total order value" value={formatPrice(stats.orderValue)} detail="Excludes cancelled and refunded orders" icon={<ShoppingBag size={18} />} />
        )}
        <StatCard
          label="Total orders"
          value={count(stats.orderCount)}
          detail="Excludes cancelled orders"
          href={can("orders.view") ? "/admin/orders" : undefined}
          icon={<ReceiptText size={18} />}
        />
        <StatCard label="Orders (last 30 days)" value={count(stats.ordersLast30Days)} detail="Placed in the past 30 days" icon={<CalendarClock size={18} />} />
        <StatCard
          label="Customers"
          value={count(stats.customerCount)}
          detail="Registered customer accounts"
          href={can("customers.view") ? "/admin/customers" : undefined}
          icon={<Users size={18} />}
        />
        <StatCard label="New customers (30 days)" value={count(stats.newCustomersLast30Days)} detail="Joined in the past 30 days" icon={<UserPlus size={18} />} />
        <StatCard
          label="Products"
          value={count(stats.productCount)}
          detail={`${count(stats.activeProductCount)} visible in the store`}
          href="/admin/products"
          icon={<Package size={18} />}
        />
        <StatCard
          label="Low stock"
          value={count(stats.lowStockCount)}
          detail={`${count(stats.outOfStockCount)} out of stock`}
          href={can("inventory.manage") ? "/admin/inventory?status=low_stock" : undefined}
          icon={<Boxes size={18} />}
        />
        <StatCard
          label="Pending orders"
          value={count(stats.pendingOrders)}
          detail="Waiting to be confirmed"
          href={can("orders.view") ? "/admin/orders?status=pending" : undefined}
          icon={<Clock size={18} />}
        />
        <StatCard
          label="Processing orders"
          value={count(stats.processingOrders)}
          detail={`${count(stats.confirmedOrders)} more confirmed`}
          href={can("orders.view") ? "/admin/orders?status=processing" : undefined}
          icon={<Loader size={18} />}
        />
      </div>

      {checklist.length > 0 && <LaunchChecklistCard items={checklist} />}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {can("orders.view") && (
          <Card>
            <CardHeader title="Recent orders" action={<TextLink href="/admin/orders">All orders</TextLink>} />
            {recentOrders.length > 0 ? (
              <OrdersTable orders={recentOrders} />
            ) : (
              <EmptyState icon={<ReceiptText size={22} />} title="No orders yet" description="New orders appear here as soon as customers check out." />
            )}
          </Card>
        )}
        <Card>
          <CardHeader
            title="Low stock inventory"
            action={can("inventory.manage") ? <TextLink href="/admin/inventory?status=low_stock">Inventory</TextLink> : undefined}
          />
          <LowStockList items={lowStock} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {can("customers.view") && (
          <Card>
            <CardHeader title="Recent customers" action={<TextLink href="/admin/customers">All customers</TextLink>} />
            <RecentCustomers customers={recentCustomers} />
          </Card>
        )}
        {showActivity && (
          <Card>
            <CardHeader
              title="Recent staff activity"
              action={can("security.view") ? <TextLink href="/admin/security">Security</TextLink> : undefined}
            />
            <ActivityFeed entries={activity} empty="Changes made in the admin panel will be listed here." />
          </Card>
        )}
      </div>
    </>
  );
}
