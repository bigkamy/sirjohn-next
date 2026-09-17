import Link from "next/link";
import { CalendarDays, IndianRupee, ReceiptText } from "lucide-react";
import { notFound } from "next/navigation";
import { OrdersTable } from "@/components/admin/orders-table";
import { RoleBadge } from "@/components/admin/ui/badge";
import { Card, CardHeader, DetailList, EmptyState, PageHeader, StatCard } from "@/components/admin/ui/primitives";
import { getCustomer } from "@/lib/admin-customers";
import { listAdminOrders } from "@/lib/admin-orders";
import { requirePermission } from "@/lib/auth/dal";
import { isStaffRole } from "@/lib/auth/roles";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";

export const metadata = { title: "Customer" };

export default async function Page({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const staff = await requirePermission("customers.view", `/admin/customers/${id}`);
  const customer = await getCustomer(id);
  if (!customer) {
    notFound();
  }

  const canSeeOrders = staff.permissions.has("orders.view");
  const { orders, total } = canSeeOrders ? await listAdminOrders({ userId: customer.id, pageSize: 50 }) : { orders: [], total: 0 };

  return (
    <>
      <PageHeader
        title={customer.name}
        back={{ href: "/admin/customers", label: "Customers" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {customer.email} <RoleBadge role={customer.role} />
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={String(customer.orderCount)} icon={<ReceiptText size={18} />} />
        <StatCard label="Total spent" value={formatPrice(customer.totalSpent)} detail="Excludes cancelled and refunded orders" icon={<IndianRupee size={18} />} />
        <StatCard label="Customer since" value={formatDate(customer.createdAt)} icon={<CalendarDays size={18} />} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader
            title="Profile"
            action={
              isStaffRole(customer.role) && staff.permissions.has("staff.manage") ? (
                <Link href={`/admin/staff/${customer.id}`} className="text-sm font-medium text-brand-700">Team member</Link>
              ) : undefined
            }
          />
          <DetailList
            items={[
              { label: "Name", value: customer.name },
              { label: "Email", value: <a href={`mailto:${customer.email}`} className="text-brand-700">{customer.email}</a> },
              { label: "Phone", value: customer.phone ?? "—" },
              { label: "Account created", value: formatDateTime(customer.createdAt) },
              { label: "Last signed in", value: customer.lastSignInAt ? formatDateTime(customer.lastSignInAt) : "Never" },
              { label: "Last order", value: customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "—" },
            ]}
          />
        </Card>

        {canSeeOrders && (
          <Card>
            <CardHeader title="Order history" description={total > orders.length ? `Showing the latest ${orders.length} of ${total}` : undefined} />
            {orders.length === 0 ? <EmptyState icon={<ReceiptText size={22} />} title="No orders yet" /> : <OrdersTable orders={orders} showCustomer={false} />}
          </Card>
        )}
      </div>
    </>
  );
}
