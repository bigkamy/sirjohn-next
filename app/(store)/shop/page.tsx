import { ShopPage } from "@/components/shop/shop-page";
import { catalogPreviewEnabled } from "@/lib/catalog-preview";
import { getCategories, getProducts } from "@/lib/products";

// Re-fetch catalog prices and stock every minute; checkout always re-prices from the database.
export const revalidate = 60;

export const metadata = {
  title: "Shop Golf Equipment",
  description: "Browse golf clubs, bags, footwear, apparel, and accessories from leading brands.",
  alternates: { canonical: "/shop" },
};

export default async function Page() {
  const [products, categories, preview] = await Promise.all([
    getProducts(),
    getCategories(),
    catalogPreviewEnabled(),
  ]);
  return <ShopPage products={products} categories={categories} preview={preview} />;
}
