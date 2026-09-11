import "server-only";
import { ilike, RANGE_NOT_SATISFIABLE, rangeFor, searchTerm } from "@/lib/admin/search";
import { requirePermission } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export type InventoryItem = {
  id: number;
  name: string;
  sku: string | null;
  image: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  isActive: boolean;
};

const COLUMNS = "id,name,sku,image,category,stock,low_stock_threshold,stock_status,is_active";

type InventoryRow = {
  id: number;
  name: string;
  sku: string | null;
  image: string;
  category: string;
  stock: number;
  low_stock_threshold: number;
  stock_status: StockStatus;
  is_active: boolean;
};

const mapRow = (row: InventoryRow): InventoryItem => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  image: row.image,
  category: row.category,
  stock: row.stock,
  lowStockThreshold: row.low_stock_threshold,
  stockStatus: row.stock_status,
  isActive: row.is_active,
});

export function isStockStatus(value: unknown): value is StockStatus {
  return typeof value === "string" && (STOCK_STATUSES as readonly string[]).includes(value);
}

/** Visible products at or below their low-stock threshold, emptiest first. */
export async function listLowStockProducts(limit = 6): Promise<InventoryItem[]> {
  await requirePermission("catalog.view", "/admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("is_active", true)
    .in("stock_status", ["low_stock", "out_of_stock"])
    .order("stock")
    .order("name")
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load low-stock products: ${error.message}`);
  }
  return (data as InventoryRow[]).map(mapRow);
}

export async function listInventory({
  q = "",
  status = "",
  page = 1,
  pageSize = 25,
}: { q?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<{ items: InventoryItem[]; total: number }> {
  await requirePermission("inventory.manage", "/admin/inventory");
  const supabase = await createClient();
  const { from, to } = rangeFor(page, pageSize);

  let query = supabase.from("products").select(COLUMNS, { count: "exact" });
  if (isStockStatus(status)) query = query.eq("stock_status", status);
  const term = searchTerm(q);
  if (term) query = query.or([ilike("name", term), ilike("sku", term)].join(","));

  const { data, error, count } = await query.order("stock").order("name").range(from, to);
  if (error?.code === RANGE_NOT_SATISFIABLE) {
    return { items: [], total: count ?? 0 };
  }
  if (error) {
    throw new Error(`Failed to load inventory: ${error.message}`);
  }
  return { items: (data as InventoryRow[]).map(mapRow), total: count ?? 0 };
}
