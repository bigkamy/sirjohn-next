import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { toUserRole, type UserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

export type AdminCustomer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  lastSignInAt: string | null;
  orderCount: number;
  /** Order totals, excluding cancelled and refunded orders. */
  totalSpent: number;
  lastOrderAt: string | null;
};

export const CUSTOMER_SORTS = ["newest", "name", "orders", "spent"] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

type CustomerRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  order_count: number | string;
  total_spent: number | string;
  last_order_at: string | null;
  total_count: number | string;
};

const mapRow = (row: CustomerRow): AdminCustomer => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  name: `${row.first_name} ${row.last_name}`.trim() || row.email,
  phone: row.phone,
  role: toUserRole(row.role),
  createdAt: row.created_at,
  lastSignInAt: row.last_sign_in_at,
  orderCount: Number(row.order_count),
  totalSpent: Number(row.total_spent),
  lastOrderAt: row.last_order_at,
});

/** Customers with their order totals, from admin_list_customers (emails live in auth.users). */
export async function listCustomers({
  q = "",
  sort = "newest",
  page = 1,
  pageSize = 20,
}: { q?: string; sort?: CustomerSort; page?: number; pageSize?: number } = {}): Promise<{ customers: AdminCustomer[]; total: number }> {
  await requirePermission("customers.view", "/admin/customers");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_customers", {
    p_search: q || null,
    p_sort: sort,
    p_limit: pageSize,
    p_offset: (Math.max(1, page) - 1) * pageSize,
  });
  if (error) {
    throw new Error(`Failed to load customers: ${error.message}`);
  }

  const rows = data as CustomerRow[];
  return { customers: rows.map(mapRow), total: rows.length > 0 ? Number(rows[0].total_count) : 0 };
}

export async function getCustomer(id: string): Promise<AdminCustomer | null> {
  await requirePermission("customers.view", `/admin/customers/${id}`);
  if (!isUuid(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_customers", { p_user_id: id, p_limit: 1 });
  if (error) {
    throw new Error(`Failed to load customer: ${error.message}`);
  }
  const rows = data as CustomerRow[];
  return rows.length > 0 ? mapRow(rows[0]) : null;
}
