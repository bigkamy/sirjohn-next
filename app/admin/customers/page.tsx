import Link from "next/link";
import { Users } from "lucide-react";
import { FilterBar, pageParam, Pagination, textParam } from "@/components/admin/ui/filter-bar";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { numericCell, Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import { CUSTOMER_SORTS, listCustomers, type CustomerSort } from "@/lib/admin-customers";
import { requirePermission } from "@/lib/auth/dal";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 20;

const SORT_LABELS: Record<CustomerSort, string> = { newest: "Newest", name: "Name", orders: "Most orders", spent: "Highest spend" };

export default async function Page({ searchParams }: PageProps<"/admin/customers">) {
  await requirePermission("customers.view", "/admin/customers");
  const params = await searchParams;
  const q = textParam(params.q);
  const sortParam = textParam(params.sort);
  const sort: CustomerSort = (CUSTOMER_SORTS as readonly string[]).includes(sortParam) ? (sortParam as CustomerSort) : "newest";
  const page = pageParam(params.page);
  const { customers, total } = await listCustomers({ q, sort, page, pageSize: PAGE_SIZE });

  return (
    <>
      <PageHeader title="Customers" description={`${total} ${total === 1 ? "customer" : "customers"}${q ? " match this search" : ""}. Total spent excludes cancelled and refunded orders.`} />

      <Card>
        <FilterBar
          action="/admin/customers"
          search={{ value: q, placeholder: "Search by name, email, or phone", label: "Search customers" }}
          selects={[
            {
              name: "sort",
              label: "Sort by",
              value: sort === "newest" ? "" : sort,
              options: CUSTOMER_SORTS.map((value) => ({ value: value === "newest" ? "" : value, label: SORT_LABELS[value] })),
            },
          ]}
        />
        {customers.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title={q ? "No customers match this search" : "No customers yet"} />
        ) : (
          <Table label="Customers">
            <THead>
              <Th>Customer</Th>
              <Th className="hidden md:table-cell">Phone</Th>
              <Th className="text-right">Orders</Th>
              <Th className="text-right">Total spent</Th>
              <Th className="hidden sm:table-cell">Joined</Th>
              <Th className="hidden lg:table-cell">Last order</Th>
            </THead>
            <TBody>
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/70">
                  <Td>
                    <Link href={`/admin/customers/${customer.id}`} className="block min-w-[200px]">
                      <span className="block font-medium text-slate-900 hover:text-emerald-700">{customer.name}</span>
                      <span className="block truncate text-xs text-slate-500">{customer.email}</span>
                    </Link>
                  </Td>
                  <Td className="hidden md:table-cell">{customer.phone ?? "—"}</Td>
                  <Td className={numericCell}>{customer.orderCount}</Td>
                  <Td className={numericCell}>{formatPrice(customer.totalSpent)}</Td>
                  <Td className="hidden whitespace-nowrap sm:table-cell">{formatDate(customer.createdAt)}</Td>
                  <Td className="hidden whitespace-nowrap lg:table-cell">{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}</Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination action="/admin/customers" page={page} pageSize={PAGE_SIZE} total={total} params={{ q, sort: sort === "newest" ? "" : sort }} />
      </Card>
    </>
  );
}
