import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  orderCount: number;
  ordersLast30Days: number;
  /** Null for roles without revenue.view; the database leaves them out. */
  orderValue: number | null;
  paidRevenue: number | null;
  customerCount: number;
  newCustomersLast30Days: number;
  productCount: number;
  activeProductCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  pendingReviews: number;
};

const count = (value: unknown) => Number(value ?? 0);
const money = (value: unknown) => (value === null || value === undefined ? null : Number(value));

/** Live figures from admin_dashboard_stats (cancelled orders excluded). */
export async function getDashboardStats(): Promise<DashboardStats> {
  await requirePermission("dashboard.view", "/admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");

  if (error) {
    throw new Error(`Failed to load dashboard stats: ${error.message}`);
  }

  return {
    orderCount: count(data.order_count),
    ordersLast30Days: count(data.orders_last_30_days),
    orderValue: money(data.order_value),
    paidRevenue: money(data.paid_revenue),
    customerCount: count(data.customer_count),
    newCustomersLast30Days: count(data.new_customers_last_30_days),
    productCount: count(data.product_count),
    activeProductCount: count(data.active_product_count),
    lowStockCount: count(data.low_stock_count),
    outOfStockCount: count(data.out_of_stock_count),
    pendingOrders: count(data.pending_orders),
    confirmedOrders: count(data.confirmed_orders),
    processingOrders: count(data.processing_orders),
    pendingReviews: count(data.pending_reviews),
  };
}
