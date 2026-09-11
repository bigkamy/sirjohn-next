import "server-only";
import { requireUser } from "@/lib/auth/dal";
import type { ProductOptionGroup } from "@/lib/product-options";
import { createClient } from "@/lib/supabase/server";

export type WishlistEntry = {
  productId: number;
  /** Null once the product has been withdrawn from the catalog. */
  product: {
    slug: string;
    name: string;
    brand: string;
    image: string;
    price: number;
    originalPrice: number | null;
    stock: number;
    hasOptions: boolean;
  } | null;
};

// Without generated types supabase-js types the to-one products embed as an array.
type WishlistRow = {
  product_id: number;
  products: {
    slug: string;
    name: string;
    brand: string;
    image: string;
    price: number | string;
    original_price: number | string | null;
    stock: number;
    options: ProductOptionGroup[] | null;
    is_active: boolean;
  } | null;
};

export async function getWishlist(): Promise<WishlistEntry[]> {
  const user = await requireUser("/account/wishlist");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id,products(slug,name,brand,image,price,original_price,stock,options,is_active)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load wishlist: ${error.message}`);
  }

  return (data as unknown as WishlistRow[]).map(({ product_id, products: product }) => ({
    productId: product_id,
    product:
      product && product.is_active
        ? {
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image: product.image,
            price: Number(product.price),
            originalPrice: product.original_price === null ? null : Number(product.original_price),
            stock: product.stock,
            hasOptions: (product.options ?? []).length > 0,
          }
        : null,
  }));
}

/** Slugs on a user's wishlist, used to fill the heart icons across the store. */
export async function getWishlistSlugs(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("wishlist_items").select("products(slug)").eq("user_id", userId);

  if (error) {
    console.error("Failed to load wishlist slugs:", error.message);
    return [];
  }

  return (data as unknown as { products: { slug: string } | null }[]).flatMap((row) =>
    row.products ? [row.products.slug] : [],
  );
}
