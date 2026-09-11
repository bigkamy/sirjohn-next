import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const LOW_STOCK_THRESHOLD = 5;

export type DashboardStats = {
  orderCount: number;
  ordersLast30Days: number;
  orderValue: number;
  paidRevenue: number;
  customerCount: number;
  newCustomersLast30Days: number;
  lowStockCount: number;
  outOfStockCount: number;
};

/** Live figures from admin_dashboard_stats (cancelled orders excluded). */
export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin("/admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats", { p_low_stock_threshold: LOW_STOCK_THRESHOLD });

  if (error) {
    throw new Error(`Failed to load dashboard stats: ${error.message}`);
  }

  return {
    orderCount: Number(data.order_count),
    ordersLast30Days: Number(data.orders_last_30_days),
    orderValue: Number(data.order_value),
    paidRevenue: Number(data.paid_revenue),
    customerCount: Number(data.customer_count),
    newCustomersLast30Days: Number(data.new_customers_last_30_days),
    lowStockCount: Number(data.low_stock_count),
    outOfStockCount: Number(data.out_of_stock_count),
  };
}
