import { ReceiptText } from "lucide-react";
import { OrdersTable } from "@/components/admin/orders-table";
import { FilterBar, pageParam, Pagination, textParam } from "@/components/admin/ui/filter-bar";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { listAdminOrders } from "@/lib/admin-orders";
import { requirePermission } from "@/lib/auth/dal";
import { ORDER_STATUS_LABELS, ORDER_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_STATUSES } from "@/lib/order-status";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 20;

export default async function Page({ searchParams }: PageProps<"/admin/orders">) {
  await requirePermission("orders.view", "/admin/orders");
  const params = await searchParams;
  const filters = { q: textParam(params.q), status: textParam(params.status), payment: textParam(params.payment) };
  const page = pageParam(params.page);
  const { orders, total } = await listAdminOrders({ ...filters, page, pageSize: PAGE_SIZE });
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader title="Orders" description={`${total} ${total === 1 ? "order" : "orders"}${filtered ? " match these filters" : " in total"}.`} />

      <Card>
        <FilterBar
          action="/admin/orders"
          search={{ value: filters.q, placeholder: "Search by order number, email, or name", label: "Search orders" }}
          selects={[
            {
              name: "status",
              label: "Order status",
              value: filters.status,
              options: [{ value: "", label: "All statuses" }, ...ORDER_STATUSES.map((status) => ({ value: status, label: ORDER_STATUS_LABELS[status] }))],
            },
            {
              name: "payment",
              label: "Payment",
              value: filters.payment,
              options: [{ value: "", label: "Any payment" }, ...PAYMENT_STATUSES.map((status) => ({ value: status, label: PAYMENT_STATUS_LABELS[status] }))],
            },
          ]}
        />
        {orders.length > 0 ? (
          <OrdersTable orders={orders} />
        ) : (
          <EmptyState
            icon={<ReceiptText size={22} />}
            title={filtered ? "No orders match these filters" : "No orders yet"}
            description={filtered ? "Try a different search or clear the filters." : "Orders appear here as soon as customers check out."}
          />
        )}
        <Pagination action="/admin/orders" page={page} pageSize={PAGE_SIZE} total={total} params={filters} />
      </Card>
    </>
  );
}
