import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type AdminCategory = {
  id: number;
  name: string;
  image: string | null;
  sortOrder: number;
  /** Products in this category, including hidden ones. */
  productCount: number;
};

export async function listCategoriesForAdmin(): Promise<AdminCategory[]> {
  await requireAdmin("/admin/categories");
  const supabase = await createClient();

  const [categories, products] = await Promise.all([
    supabase.from("categories").select("id,name,image,sort_order").order("sort_order").order("name"),
    supabase.from("products").select("category"),
  ]);
  if (categories.error || products.error) {
    throw new Error(`Failed to load categories: ${(categories.error ?? products.error)?.message}`);
  }

  const counts = new Map<string, number>();
  for (const { category } of products.data) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return categories.data.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.image,
    sortOrder: row.sort_order,
    productCount: counts.get(row.name) ?? 0,
  }));
}
