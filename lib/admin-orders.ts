import "server-only";
import { listActivity, type ActivityEntry } from "@/lib/admin-activity";
import { ilike, RANGE_NOT_SATISFIABLE, rangeFor, searchTerm } from "@/lib/admin/search";
import { requirePermission } from "@/lib/auth/dal";
import { isOrderStatus, isPaymentStatus, type PaymentStatus } from "@/lib/order-status";
import { fetchOrderDetail, type OrderDetail } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export type AdminOrderRow = {
  orderNumber: string;
  status: string;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  itemCount: number;
  customerName: string;
  email: string;
  userId: string | null;
};

type OrderListRow = {
  order_number: string;
  status: string;
  payment_status: PaymentStatus;
  total: number | string;
  created_at: string;
  email: string;
  user_id: string | null;
  shipping_address: { full_name?: string } | null;
  order_items: { quantity: number }[];
};

/** Orders, newest first, with search (order number, email, name) and status filters. */
export async function listAdminOrders({
  q = "",
  status = "",
  payment = "",
  userId,
  page = 1,
  pageSize = 20,
}: { q?: string; status?: string; payment?: string; userId?: string; page?: number; pageSize?: number } = {}): Promise<{
  orders: AdminOrderRow[];
  total: number;
}> {
  await requirePermission("orders.view", "/admin/orders");
  const supabase = await createClient();
  const { from, to } = rangeFor(page, pageSize);

  let query = supabase
    .from("orders")
    .select("order_number,status,payment_status,total,created_at,email,user_id,shipping_address,order_items(quantity)", { count: "exact" });
  if (isOrderStatus(status)) query = query.eq("status", status);
  if (isPaymentStatus(payment)) query = query.eq("payment_status", payment);
  if (userId) query = query.eq("user_id", userId);
  const term = searchTerm(q);
  if (term) {
    query = query.or([ilike("order_number", term), ilike("email", term), ilike("shipping_address->>full_name", term)].join(","));
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error?.code === RANGE_NOT_SATISFIABLE) {
    return { orders: [], total: count ?? 0 };
  }
  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  const orders = (data as OrderListRow[]).map((row) => ({
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    total: Number(row.total),
    createdAt: row.created_at,
    itemCount: row.order_items.reduce((sum, item) => sum + item.quantity, 0),
    customerName: row.shipping_address?.full_name ?? row.email,
    email: row.email,
    userId: row.user_id,
  }));
  return { orders, total: count ?? orders.length };
}

export type PaymentRecord = {
  id: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
};

export type AdminOrder = OrderDetail & {
  /** Null when this role can't see payment records (payments.view). */
  payments: PaymentRecord[] | null;
  activity: ActivityEntry[];
};

type PaymentRow = {
  id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  created_at: string;
};

export const mapPayment = (row: PaymentRow): PaymentRecord => ({
  id: row.id,
  provider: row.provider,
  providerOrderId: row.provider_order_id,
  providerPaymentId: row.provider_payment_id,
  amount: Number(row.amount),
  currency: row.currency,
  status: row.status,
  createdAt: row.created_at,
});

export const PAYMENT_COLUMNS = "id,provider,provider_order_id,provider_payment_id,amount,currency,status,created_at";

export async function getAdminOrder(orderNumber: string): Promise<AdminOrder | null> {
  const staff = await requirePermission("orders.view", `/admin/orders/${encodeURIComponent(orderNumber)}`);
  const order = await fetchOrderDetail(orderNumber, null);
  if (!order) {
    return null;
  }

  const supabase = await createClient();
  const [payments, activity] = await Promise.all([
    staff.permissions.has("payments.view")
      ? supabase
          .from("payments")
          .select(PAYMENT_COLUMNS)
          .eq("order_id", order.id)
          .order("created_at", { ascending: false })
          .then(({ data, error }) => {
            if (error) throw new Error(`Failed to load payments: ${error.message}`);
            return (data as PaymentRow[]).map(mapPayment);
          })
      : Promise.resolve(null),
    listActivity({ entityType: "order", entityId: order.orderNumber, limit: 50 }),
  ]);

  return { ...order, payments, activity };
}
