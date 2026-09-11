import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import type { ProductOptionGroup } from "@/lib/product-options";
import { createClient } from "@/lib/supabase/server";
import { isPositiveInteger } from "@/lib/validation";

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  stock: number;
  isActive: boolean;
  isSample: boolean;
  options: ProductOptionGroup[];
};

const COLUMNS =
  "id,name,slug,brand,category,price,original_price,badge,short_description,description,image,gallery,stock,is_active,is_sample,options";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number | string;
  original_price: number | string | null;
  badge: string | null;
  short_description: string;
  description: string;
  image: string;
  gallery: string[] | null;
  stock: number;
  is_active: boolean;
  is_sample: boolean;
  options: ProductOptionGroup[] | null;
};

const mapRow = (row: ProductRow): AdminProduct => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  brand: row.brand,
  category: row.category,
  price: Number(row.price),
  originalPrice: row.original_price === null ? null : Number(row.original_price),
  badge: row.badge,
  shortDescription: row.short_description,
  description: row.description,
  image: row.image,
  gallery: row.gallery ?? [],
  stock: row.stock,
  isActive: row.is_active,
  isSample: row.is_sample,
  options: row.options ?? [],
});

// Admins see hidden products too (RLS lets them).

export async function listProductsForAdmin(): Promise<AdminProduct[]> {
  await requireAdmin("/admin/products");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .order("id");

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }
  return (data as ProductRow[]).map(mapRow);
}

export async function getProductForAdmin(id: number): Promise<AdminProduct | null> {
  await requireAdmin(`/admin/products/${id}`);
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
