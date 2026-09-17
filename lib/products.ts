import { unstable_cache } from "next/cache";
import { cache } from "react";
import { catalogPreviewEnabled } from "@/lib/catalog-preview";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-images";
import type { ProductOptionGroup } from "@/lib/product-options";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export type Product = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  badge: string;
  /** Only shown when there are real reviews (reviews > 0). */
  rating: number;
  reviews: number;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  stock: number;
  /** Choices the customer must make before buying; empty for simple products. */
  options: ProductOptionGroup[];
  /** Demo data from seed.sql, labelled "Sample" in the store. */
  isSample: boolean;
};

export type CategorySummary = { name: string; image: string | null };

/** Cache tag for anything derived from the catalog; admin catalog edits revalidate it. */
export const CATALOG_CACHE_TAG = "catalog";

const handOrientation = { name: "Hand Orientation", values: ["Right Hand", "Left Hand"] };
const shaftFlex = { name: "Shaft Flex", values: ["Regular", "Stiff", "Extra Stiff", "Senior"] };

type SampleInput = Pick<Product, "id" | "name" | "slug" | "category" | "price" | "originalPrice" | "badge" | "stock" | "options">;

// Mirrors seed.sql: placeholder image and copy, no ratings, clearly flagged as sample.
const sampleProduct = (input: SampleInput): Product => ({
  ...input,
  brand: "Sample Brand",
  rating: 0,
  reviews: 0,
  description:
    "Sample product used for testing. Replace this description with the real product details, or remove the sample catalog from the admin panel.",
  shortDescription: "Sample product — replace before launch.",
  image: PRODUCT_PLACEHOLDER_IMAGE,
  gallery: [PRODUCT_PLACEHOLDER_IMAGE],
  isSample: true,
});

/** Only used when Supabase isn't configured (local development). */
export const sampleProducts: Product[] = [
  sampleProduct({ id: 1, name: "Apex Pro Driver", slug: "apex-pro-driver", category: "Clubs", price: 32999, originalPrice: 39999, badge: "New", stock: 12, options: [handOrientation, shaftFlex] }),
  sampleProduct({ id: 2, name: "Precision Fairway Wood", slug: "precision-fairway-wood", category: "Clubs", price: 24999, originalPrice: 28999, badge: "Featured", stock: 8, options: [handOrientation, shaftFlex] }),
  sampleProduct({ id: 3, name: "Elite Wedge Set", slug: "elite-wedge-set", category: "Accessories", price: 18999, originalPrice: 22999, badge: "Sale", stock: 14, options: [handOrientation, shaftFlex] }),
  sampleProduct({ id: 4, name: "Summit Golf Bag", slug: "summit-golf-bag", category: "Bags", price: 16999, originalPrice: 19999, badge: "", stock: 22, options: [] }),
  sampleProduct({ id: 5, name: "Tour Grip Gloves", slug: "tour-grip-gloves", category: "Accessories", price: 1299, originalPrice: 1999, badge: "", stock: 43, options: [handOrientation] }),
  sampleProduct({ id: 6, name: "Ridge Pro Shoes", slug: "ridge-pro-shoes", category: "Footwear", price: 7499, originalPrice: 9999, badge: "", stock: 16, options: [] }),
];

const sampleCategories: CategorySummary[] = ["Clubs", "Bags", "Apparel", "Accessories", "Footwear", "Balls"].map(
  (name) => ({ name, image: null }),
);

// Columns of public.products (supabase/migrations). Numeric columns may arrive as strings.
const PRODUCT_COLUMNS =
  "id,name,slug,brand,category,price,original_price,badge,rating,reviews,description,short_description,image,gallery,stock,options,is_sample";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number | string;
  original_price: number | string | null;
  badge: string | null;
  rating: number | string;
  reviews: number;
  description: string;
  short_description: string;
  image: string;
  gallery: string[] | null;
  stock: number;
  options: ProductOptionGroup[] | null;
  is_sample: boolean | null;
};

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price ?? row.price),
    badge: row.badge ?? "",
    rating: Number(row.rating),
    reviews: row.reviews,
    description: row.description,
    shortDescription: row.short_description || row.description,
    image: row.image,
    gallery: row.gallery?.length ? row.gallery : [row.image],
    stock: row.stock,
    options: Array.isArray(row.options) ? row.options : [],
    isSample: Boolean(row.is_sample),
  };
}

/**
 * Two conditions have to hold before a product reaches a customer: it is active, and it has
 * a price. The price guard is deliberate belt and braces — a product imported or created
 * without one would otherwise go on sale at ₹0, and hiding it costs nothing, because a
 * ₹0 product is never something the store means to sell. The admin panel is unaffected: it
 * reads through lib/admin-products.ts and still lists and edits every row.
 */
const MINIMUM_SELLABLE_PRICE = 0;

// The sample catalog is only for local development without Supabase. Once Supabase is
// configured, failures surface as errors instead of silently showing sample products.
export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return sampleProducts.filter((product) => product.price > MINIMUM_SELLABLE_PRICE);
  }

  // Local preview for staff (lib/catalog-preview.ts): reads through the session, so row level
  // security is what allows the hidden rows, and drops the two storefront conditions to show
  // what the shop will look like once prices are set. Never true in a production build.
  if (await catalogPreviewEnabled()) {
    const { data, error } = await (await createSessionClient())
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("created_at", { ascending: false })
      .order("id");

    if (error) {
      throw new Error(`Failed to load products for preview: ${error.message}`);
    }

    return (data as ProductRow[]).map(mapProductRow);
  }

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .gt("price", MINIMUM_SELLABLE_PRICE)
    .order("created_at", { ascending: false })
    .order("id");

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data as ProductRow[]).map(mapProductRow);
}

// Memoized per request, so a page and its metadata share one query.
export const getProductBySlug = cache((slug: string) => findProduct("slug", slug));

export const getProductById = cache((id: number) => findProduct("id", id));

async function findProduct(column: "slug" | "id", value: string | number): Promise<Product | undefined> {
  if (!isSupabaseConfigured()) {
    return sampleProducts.find(
      (product) => product[column] === value && product.price > MINIMUM_SELLABLE_PRICE,
    );
  }

  // In preview, a card in the listing has to open its own page, so the same relaxation
  // applies here. addToCart resolves products through this lookup too, but a previewed
  // product still cannot be bought: the cart refuses anything with no stock, and place_order
  // re-checks stock and price in the database, where the preview has no say.
  if (await catalogPreviewEnabled()) {
    const { data, error } = await (await createSessionClient())
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq(column, value)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product ${column}=${value} for preview: ${error.message}`);
    }

    return data ? mapProductRow(data as ProductRow) : undefined;
  }

  // Same two conditions as getProducts, so an unpriced product 404s on its own page as well
  // as vanishing from the listings — and addToCart, which resolves the product this way,
  // refuses it too.
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .gt("price", MINIMUM_SELLABLE_PRICE)
    .eq(column, value)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product ${column}=${value}: ${error.message}`);
  }

  return data ? mapProductRow(data as ProductRow) : undefined;
}

/** Categories in display order, with their home page image. Cached; the header needs them on every page. */
export const getCategoryList = unstable_cache(
  async (): Promise<CategorySummary[]> => {
    if (!isSupabaseConfigured()) {
      return sampleCategories;
    }

    const { data, error } = await createPublicClient()
      .from("categories")
      .select("name,image")
      .order("sort_order")
      .order("name");

    if (error) {
      // The header can do without the list; don't take the whole page down.
      console.error("Failed to load categories:", error.message);
      return [];
    }

    return data as CategorySummary[];
  },
  ["category-list"],
  { tags: [CATALOG_CACHE_TAG], revalidate: 300 },
);

export async function getCategories(): Promise<string[]> {
  return (await getCategoryList()).map((category) => category.name);
}
