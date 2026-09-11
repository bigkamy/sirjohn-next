import { Suspense } from "react";
import { ShopCatalog, ShopCatalogFromUrl } from "@/components/shop/shop-catalog";
import type { Product } from "@/lib/products";

export function ShopPage({ products, categories }: { products: Product[]; categories: string[] }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* The full catalog is prerendered for search engines; filters from the URL apply once loaded. */}
      <Suspense fallback={<ShopCatalog products={products} categories={categories} />}>
        <ShopCatalogFromUrl products={products} categories={categories} />
      </Suspense>
    </main>
  );
}
