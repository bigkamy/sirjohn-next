import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export type DayPoint = { day: string; label: string; fullLabel: string };
export type SalesPoint = DayPoint & { orders: number; orderValue: number; paidRevenue: number };
export type CustomerPoint = DayPoint & { newCustomers: number; totalCustomers: number };
export type ProductPerformance = {
  productId: number;
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
  stock: number;
  unitsSold: number;
  revenue: number;
};

export type Analytics = {
  days: AnalyticsPeriod;
  sales: SalesPoint[];
  customers: CustomerPoint[];
  totals: { orders: number; orderValue: number; paidRevenue: number; newCustomers: number; totalCustomers: number };
  bestSellers: ProductPerformance[];
  lowPerformers: ProductPerformance[];
};

export function isAnalyticsPeriod(value: number): value is AnalyticsPeriod {
  return (ANALYTICS_PERIODS as readonly number[]).includes(value);
}

// Days come back as dates in India time ("2026-09-11"); label them without shifting zones.
const dayLabels = (day: string): DayPoint => {
  const date = new Date(`${day}T00:00:00Z`);
  return {
    day,
    label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }),
    fullLabel: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
  };
};

/** Every figure is computed in the database from real orders, customers and products. */
export async function getAnalytics(days: AnalyticsPeriod): Promise<Analytics> {
  await requirePermission("analytics.view", "/admin/analytics");
  const supabase = await createClient();

  const [sales, customers, products] = await Promise.all([
    supabase.rpc("admin_sales_series", { p_days: days }),
    supabase.rpc("admin_customer_series", { p_days: days }),
    supabase.rpc("admin_product_performance", { p_days: days }),
  ]);
  const error = sales.error ?? customers.error ?? products.error;
  if (error) {
    throw new Error(`Failed to load analytics: ${error.message}`);
  }

  const salesPoints: SalesPoint[] = (sales.data as { day: string; orders: number; order_value: number | string; paid_revenue: number | string }[]).map(
    (row) => ({ ...dayLabels(row.day), orders: Number(row.orders), orderValue: Number(row.order_value), paidRevenue: Number(row.paid_revenue) }),
  );
  const customerPoints: CustomerPoint[] = (customers.data as { day: string; new_customers: number; total_customers: number }[]).map((row) => ({
    ...dayLabels(row.day),
    newCustomers: Number(row.new_customers),
    totalCustomers: Number(row.total_customers),
  }));
  const performance: ProductPerformance[] = (
    products.data as {
      product_id: number;
      name: string;
      slug: string;
      image: string;
      is_active: boolean;
      stock: number;
      units_sold: number;
      revenue: number | string;
    }[]
  ).map((row) => ({
    productId: row.product_id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    isActive: row.is_active,
    stock: row.stock,
    unitsSold: Number(row.units_sold),
    revenue: Number(row.revenue),
  }));

  const sum = <T,>(list: T[], pick: (item: T) => number) => list.reduce((total, item) => total + pick(item), 0);

  return {
    days,
    sales: salesPoints,
    customers: customerPoints,
    totals: {
      orders: sum(salesPoints, (point) => point.orders),
      orderValue: sum(salesPoints, (point) => point.orderValue),
      paidRevenue: sum(salesPoints, (point) => point.paidRevenue),
      newCustomers: sum(customerPoints, (point) => point.newCustomers),
      totalCustomers: customerPoints.at(-1)?.totalCustomers ?? 0,
    },
    bestSellers: performance.filter((product) => product.unitsSold > 0).slice(0, 5),
    // Visible products that sold least (including nothing) in the period.
    lowPerformers: performance
      .filter((product) => product.isActive)
      .sort((a, b) => a.unitsSold - b.unitsSold || a.revenue - b.revenue || a.name.localeCompare(b.name))
      .slice(0, 5),
  };
}
