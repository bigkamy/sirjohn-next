import Link from "next/link";
import { CalendarRange, IndianRupee, ReceiptText, UserPlus } from "lucide-react";
import { BarList } from "@/components/admin/charts/bar-list";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import { textParam } from "@/components/admin/ui/filter-bar";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/admin/ui/primitives";
import { numericCell, Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import { ANALYTICS_PERIODS, getAnalytics, isAnalyticsPeriod } from "@/lib/admin-analytics";
import { requirePermission } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Analytics" };

export default async function Page({ searchParams }: PageProps<"/admin/analytics">) {
  const staff = await requirePermission("analytics.view", "/admin/analytics");
  const params = await searchParams;
  const requested = Number(textParam(params.days));
  const days = isAnalyticsPeriod(requested) ? requested : 30;
  const data = await getAnalytics(days);
  const canEdit = staff.permissions.has("catalog.manage");

  return (
    <>
      <PageHeader title="Analytics" description="Computed from your orders, customers and products. Cancelled orders are left out; order value also leaves out refunds. Days are in India time." />

      {/* One filter row, above everything it scopes. */}
      <nav aria-label="Time period" className="mb-6 flex flex-wrap items-center gap-2">
        <CalendarRange size={16} className="text-slate-400" aria-hidden />
        {ANALYTICS_PERIODS.map((period) => (
          <Link
            key={period}
            href={`/admin/analytics?days=${period}`}
            aria-current={period === days ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${period === days ? "bg-[#0f172a] text-white" : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900"}`}
          >
            Last {period} days
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Order value (${days} days)`} value={formatPrice(data.totals.orderValue)} icon={<IndianRupee size={18} />} />
        <StatCard label={`Paid revenue (${days} days)`} value={formatPrice(data.totals.paidRevenue)} detail="Orders with a confirmed payment" icon={<IndianRupee size={18} />} />
        <StatCard label={`Orders (${days} days)`} value={data.totals.orders.toLocaleString("en-IN")} icon={<ReceiptText size={18} />} />
        <StatCard label={`New customers (${days} days)`} value={data.totals.newCustomers.toLocaleString("en-IN")} detail={`${data.totals.totalCustomers} in total`} icon={<UserPlus size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardHeader title="Revenue trend" description="Order value per day, excluding cancelled and refunded orders" />
          <div className="p-5">
            <TrendChart
              title="Order value"
              format="currency"
              points={data.sales.map((point) => ({
                label: point.label,
                fullLabel: point.fullLabel,
                value: point.orderValue,
                detail: `${point.orders} ${point.orders === 1 ? "order" : "orders"}`,
              }))}
              emptyText="No orders in this period."
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Order trend" description="Orders placed per day, excluding cancelled orders" />
          <div className="p-5">
            <TrendChart
              title="Orders"
              format="number"
              points={data.sales.map((point) => ({ label: point.label, fullLabel: point.fullLabel, value: point.orders }))}
              emptyText="No orders in this period."
            />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title="Customer growth" description="Registered customer accounts over time" />
          <div className="p-5">
            <TrendChart
              title="Customers"
              format="number"
              variant="line"
              points={data.customers.map((point) => ({
                label: point.label,
                fullLabel: point.fullLabel,
                value: point.totalCustomers,
                detail: `${point.newCustomers} new`,
              }))}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Best-selling products" description={`Units sold in the last ${days} days`} />
          {data.bestSellers.length === 0 ? (
            <EmptyState title="No sales in this period" />
          ) : (
            <BarList
              items={data.bestSellers.map((product) => ({
                key: product.productId,
                name: product.name,
                href: canEdit ? `/admin/products/${product.productId}/edit` : undefined,
                value: product.unitsSold,
                valueLabel: `${product.unitsSold} sold · ${formatPrice(product.revenue)}`,
              }))}
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Low-performing products" description={`Visible products that sold least in the last ${days} days`} />
          {data.lowPerformers.length === 0 ? (
            <EmptyState title="No visible products" />
          ) : (
            <Table label="Low-performing products">
              <THead>
                <Th>Product</Th>
                <Th className="text-right">Sold</Th>
                <Th className="text-right">Value</Th>
                <Th className="text-right">In stock</Th>
              </THead>
              <TBody>
                {data.lowPerformers.map((product) => (
                  <tr key={product.productId}>
                    <Td>
                      {canEdit ? (
                        <Link href={`/admin/products/${product.productId}/edit`} className="font-medium text-slate-900 hover:text-emerald-700">
                          {product.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{product.name}</span>
                      )}
                    </Td>
                    <Td className={numericCell}>{product.unitsSold}</Td>
                    <Td className={numericCell}>{formatPrice(product.revenue)}</Td>
                    <Td className={numericCell}>{product.stock}</Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
