import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Card, EmptyState, Notice, PageHeader } from "@/components/admin/ui/primitives";
import { buttonClass } from "@/components/admin/ui/styles";
import { ProductCard } from "@/components/ui/product-card";
import { listProductsForAdmin, type AdminProduct } from "@/lib/admin-products";
import { requirePermission } from "@/lib/auth/dal";

export const metadata = { title: "Preview product cards" };

/**
 * The shop's own product card, drawn for every product including the hidden ones, so the
 * catalog and its photography can be checked before anything goes on sale.
 *
 * Nothing here weakens the storefront. The page is behind catalog.view, and it reads through
 * the session-aware client, so the rows come back only because row level security lets a
 * staff member see them: "Active products are public; staff see all". An anonymous request
 * is refused by Postgres, whatever the app asks for. The storefront's own query is untouched
 * and still requires is_active together with a price above zero.
 */

// The catalog is small enough to preview in one page; raise this if it grows past a few hundred.
const PAGE_SIZE = 200;

type Filter = "all" | "hidden" | "live";

const TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hidden", label: "Hidden" },
  { key: "live", label: "Live" },
];

/** Both conditions the storefront applies, so the note says why a card is not on sale. */
function shopStatus(product: AdminProduct): string {
  if (!product.isActive) return "Hidden from the shop";
  if (product.price <= 0) return "Hidden: no price set";
  return "Live in the shop";
}

export default async function Page({ searchParams }: PageProps<"/admin/products/preview">) {
  await requirePermission("catalog.view", "/admin/products/preview");
  const params = await searchParams;
  const show: Filter = params.show === "hidden" || params.show === "live" ? params.show : "all";

  const { products } = await listProductsForAdmin({
    visibility: show === "all" ? "" : show === "live" ? "visible" : "hidden",
    pageSize: PAGE_SIZE,
    sort: "newest",
  });

  const hiddenCount = products.filter((product) => !product.isActive || product.price <= 0).length;

  return (
    <>
      <PageHeader
        title="Preview product cards"
        description="Every product as the shop would draw it, hidden ones included. Only staff can see this page."
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={tab.key === "all" ? "/admin/products/preview" : `/admin/products/preview?show=${tab.key}`}
                aria-current={show === tab.key ? "page" : undefined}
                className={buttonClass(show === tab.key ? "primary" : "secondary", "sm")}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        }
      />

      {hiddenCount > 0 && (
        <div className="mb-6">
          <Notice tone="warning">
            {hiddenCount === 1
              ? "1 product below is not on sale."
              : `${hiddenCount} products below are not on sale.`}{" "}
            Customers cannot see or buy them: the shop shows a product only when it is visible
            and its price is above zero. Set the price and stock on each one, tick “Visible in
            the store”, and it will appear for real.
          </Notice>
        </div>
      )}

      {products.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PackageSearch size={20} />}
            title="Nothing to preview"
            description="No product matches this filter."
          />
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              brand={product.brand}
              price={product.price}
              originalPrice={product.originalPrice ?? undefined}
              badge={product.badge ?? undefined}
              image={product.image}
              slug={product.slug}
              isSample={product.isSample}
              preview={shopStatus(product)}
            />
          ))}
        </div>
      )}
    </>
  );
}
