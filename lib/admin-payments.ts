import "server-only";
import { mapPayment, PAYMENT_COLUMNS, type PaymentRecord } from "@/lib/admin-orders";
import { requirePermission } from "@/lib/auth/dal";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";

export type PaymentOverview = {
  /** Orders per payment status, excluding cancelled orders. */
  counts: Record<PaymentStatus, number>;
  payments: (PaymentRecord & { orderNumber: string | null })[];
};

export async function getPaymentOverview(): Promise<PaymentOverview> {
  await requirePermission("payments.view", "/admin/payments");
  const supabase = await createClient();

  const [counts, records] = await Promise.all([
    Promise.all(
      PAYMENT_STATUSES.map(async (status) => {
        const { count, error } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", status)
          .neq("status", "cancelled");
        if (error) throw new Error(`Failed to count ${status} payments: ${error.message}`);
        return [status, count ?? 0] as const;
      }),
    ),
    supabase.from("payments").select(`${PAYMENT_COLUMNS},orders(order_number)`).order("created_at", { ascending: false }).limit(50),
  ]);

  if (records.error) {
    throw new Error(`Failed to load payments: ${records.error.message}`);
  }

  // A to-one embed; without generated types supabase-js can't know that.
  const rows = records.data as unknown as (Parameters<typeof mapPayment>[0] & { orders: { order_number: string } | null })[];
  return {
    counts: Object.fromEntries(counts) as Record<PaymentStatus, number>,
    payments: rows.map((row) => ({ ...mapPayment(row), orderNumber: row.orders?.order_number ?? null })),
  };
}
