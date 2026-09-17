import { Suspense } from "react";
import { Eye } from "lucide-react";
import { ShopCatalog, ShopCatalogFromUrl } from "@/components/shop/shop-catalog";
import type { Product } from "@/lib/products";

type ShopPageProps = {
  products: Product[];
  categories: string[];
  /** True when the listing includes products no customer can see (lib/catalog-preview.ts). */
  preview?: boolean;
};

export function ShopPage({ products, categories, preview = false }: ShopPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {preview && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Eye size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            <strong className="font-semibold">Development preview.</strong> This listing includes
            products that are hidden or have no price, so it is not what a customer sees. Only
            signed-in staff get this, only outside production, and nothing here can be bought.
          </p>
        </div>
      )}

      {/* The full catalog is prerendered for search engines; filters from the URL apply once loaded. */}
      <Suspense fallback={<ShopCatalog products={products} categories={categories} />}>
        <ShopCatalogFromUrl products={products} categories={categories} />
      </Suspense>
    </main>
  );
}
