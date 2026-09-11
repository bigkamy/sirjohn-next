import "server-only";
import { isStockStatus, type StockStatus } from "@/lib/admin-inventory";
import { ilike, RANGE_NOT_SATISFIABLE, rangeFor, searchTerm } from "@/lib/admin/search";
import { requirePermission } from "@/lib/auth/dal";
import type { ProductOptionGroup } from "@/lib/product-options";
import { createClient } from "@/lib/supabase/server";
import { isPositiveInteger } from "@/lib/validation";

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  sku: string | null;
  /** What the customer pays today (products.price). */
  price: number;
  /** The usual price; above `price` while the product is on sale (products.original_price). */
  originalPrice: number | null;
  /** The form's "price" and "sale price", derived from the two columns above. */
  regularPrice: number;
  salePrice: number | null;
  badge: string | null;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  stock: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  isActive: boolean;
  isSample: boolean;
  options: ProductOptionGroup[];
  createdAt: string;
  updatedAt: string;
};

const COLUMNS =
  "id,name,slug,brand,category,sku,price,original_price,badge,short_description,description,image,gallery,stock,low_stock_threshold,stock_status,is_active,is_sample,options,created_at,updated_at";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  sku: string | null;
  price: number | string;
  original_price: number | string | null;
  badge: string | null;
  short_description: string;
  description: string;
  image: string;
  gallery: string[] | null;
  stock: number;
  low_stock_threshold: number;
  stock_status: StockStatus;
  is_active: boolean;
  is_sample: boolean;
  options: ProductOptionGroup[] | null;
  created_at: string;
  updated_at: string;
};

const mapRow = (row: ProductRow): AdminProduct => {
  const price = Number(row.price);
  const originalPrice = row.original_price === null ? null : Number(row.original_price);
  const onSale = originalPrice !== null && originalPrice > price;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    category: row.category,
    sku: row.sku,
    price,
    originalPrice,
    regularPrice: onSale ? originalPrice : price,
    salePrice: onSale ? price : null,
    badge: row.badge,
    shortDescription: row.short_description,
    description: row.description,
    image: row.image,
    gallery: row.gallery ?? [],
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    stockStatus: row.stock_status,
    isActive: row.is_active,
    isSample: row.is_sample,
    options: row.options ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const SORTS = {
  newest: { column: "created_at", ascending: false },
  name: { column: "name", ascending: true },
  "price-asc": { column: "price", ascending: true },
  "price-desc": { column: "price", ascending: false },
  "stock-asc": { column: "stock", ascending: true },
} as const;

export type ProductSort = keyof typeof SORTS;

export const PRODUCT_SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "stock-asc", label: "Stock: lowest first" },
];

export type ProductFilters = {
  q?: string;
  category?: string;
  visibility?: string;
  stock?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

// Staff with catalog.view see hidden products too (RLS lets them).
export async function listProductsForAdmin({
  q = "",
  category = "",
  visibility = "",
  stock = "",
  sort = "newest",
  page = 1,
  pageSize = 20,
}: ProductFilters = {}): Promise<{ products: AdminProduct[]; total: number }> {
  await requirePermission("catalog.view", "/admin/products");
  const supabase = await createClient();
  const { from, to } = rangeFor(page, pageSize);
  const order = SORTS[sort as ProductSort] ?? SORTS.newest;

  let query = supabase.from("products").select(COLUMNS, { count: "exact" });
  const term = searchTerm(q);
  if (term) query = query.or([ilike("name", term), ilike("brand", term), ilike("sku", term), ilike("slug", term)].join(","));
  if (category) query = query.eq("category", category);
  if (visibility === "visible") query = query.eq("is_active", true);
  if (visibility === "hidden") query = query.eq("is_active", false);
  if (visibility === "sample") query = query.eq("is_sample", true);
  if (isStockStatus(stock)) query = query.eq("stock_status", stock);

  const { data, error, count } = await query.order(order.column, { ascending: order.ascending }).order("id").range(from, to);
  if (error?.code === RANGE_NOT_SATISFIABLE) {
    return { products: [], total: count ?? 0 };
  }
  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }
  return { products: (data as ProductRow[]).map(mapRow), total: count ?? 0 };
}

export async function countSampleProducts(): Promise<number> {
  await requirePermission("catalog.view", "/admin/products");
  const supabase = await createClient();
  const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_sample", true);
  if (error) {
    throw new Error(`Failed to count sample products: ${error.message}`);
  }
  return count ?? 0;
}

export async function getProductForAdmin(id: number): Promise<AdminProduct | null> {
  await requirePermission("catalog.view", `/admin/products/${id}/edit`);
  if (!isPositiveInteger(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load product ${id}: ${error.message}`);
  }
  return data ? mapRow(data as ProductRow) : null;
}
