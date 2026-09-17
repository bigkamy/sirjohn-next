import Link from "next/link";
import { Boxes } from "lucide-react";
import { ThresholdEditor } from "@/components/admin/inventory/threshold-editor";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import { StockBadge, VisibilityBadge } from "@/components/admin/ui/badge";
import { FilterBar, pageParam, Pagination, textParam } from "@/components/admin/ui/filter-bar";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import { listInventory } from "@/lib/admin-inventory";
import { requirePermission } from "@/lib/auth/dal";

export const metadata = { title: "Inventory" };

const PAGE_SIZE = 25;

export default async function Page({ searchParams }: PageProps<"/admin/inventory">) {
  const staff = await requirePermission("inventory.manage", "/admin/inventory");
  const canEditProducts = staff.permissions.has("catalog.manage");
  const params = await searchParams;
  const filters = { q: textParam(params.q), status: textParam(params.status) };
  const page = pageParam(params.page);
  const { items, total } = await listInventory({ ...filters, page, pageSize: PAGE_SIZE });

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock changes are relative to the live count, so they never undo a sale made in the meantime. A product is flagged as low stock at or below its alert level."
      />

      <Card>
        <FilterBar
          action="/admin/inventory"
          search={{ value: filters.q, placeholder: "Search by name or SKU", label: "Search inventory" }}
          selects={[
            {
              name: "status",
              label: "Stock status",
              value: filters.status,
              options: [
                { value: "", label: "All stock levels" },
                { value: "low_stock", label: "Low stock" },
                { value: "out_of_stock", label: "Out of stock" },
                { value: "in_stock", label: "In stock" },
              ],
            },
          ]}
        />

        {items.length === 0 ? (
          <EmptyState icon={<Boxes size={22} />} title={filters.q || filters.status ? "Nothing matches these filters" : "No products yet"} />
        ) : (
          <Table label="Inventory">
            <THead>
              <Th>Product</Th>
              <Th>Status</Th>
              <Th>Stock</Th>
              <Th>Alert at</Th>
              <Th className="hidden lg:table-cell">Visibility</Th>
            </THead>
            <TBody>
              {items.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <div className="flex min-w-[200px] items-center gap-3">
                      <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-cover" />
                      <div className="min-w-0">
                        {canEditProducts ? (
                          <Link href={`/admin/products/${item.id}/edit`} className="block truncate font-medium text-slate-900 hover:text-brand-700">
                            {item.name}
                          </Link>
                        ) : (
                          <p className="truncate font-medium text-slate-900">{item.name}</p>
                        )}
                        <p className="truncate text-xs text-slate-500">
                          {item.sku ? `SKU ${item.sku} · ` : ""}
                          {item.category}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td><StockBadge stock={item.stock} threshold={item.lowStockThreshold} /></Td>
                  <Td><StockAdjuster productId={item.id} name={item.name} stock={item.stock} /></Td>
                  <Td><ThresholdEditor key={`${item.id}-${item.lowStockThreshold}`} productId={item.id} name={item.name} threshold={item.lowStockThreshold} /></Td>
                  <Td className="hidden lg:table-cell"><VisibilityBadge active={item.isActive} /></Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination action="/admin/inventory" page={page} pageSize={PAGE_SIZE} total={total} params={filters} />
      </Card>
    </>
  );
}
