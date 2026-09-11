import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/products/product-row-actions";
import { Badge } from "@/components/admin/ui/badge";
import { PageHeader } from "@/components/admin/ui/primitives";
import { buttonClass } from "@/components/admin/ui/styles";
import { getProductForAdmin } from "@/lib/admin-products";
import { requirePermission } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { getCategories } from "@/lib/products";

export const metadata = { title: "Edit Product" };

export default async function Page({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  await requirePermission("catalog.manage", `/admin/products/${encodeURIComponent(id)}/edit`);
  const [product, categories] = await Promise.all([getProductForAdmin(Number(id)), getCategories()]);
  if (!product) {
    notFound();
  }

  // Keep the product's own category selectable even if it's missing from the cached list.
  const categoryOptions = categories.includes(product.category) ? categories : [...categories, product.category];

  return (
    <>
      <PageHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {product.isSample && <Badge tone="warning">Sample</Badge>}
            Last updated {formatDateTime(product.updatedAt)}
          </span>
        }
        actions={
          <>
            {product.isActive && (
              <Link href={`/product/${product.slug}`} target="_blank" rel="noopener" prefetch={false} className={buttonClass("secondary")}>
                View in store <ExternalLink size={14} aria-hidden />
              </Link>
            )}
            <DeleteProductButton productId={product.id} name={product.name} />
          </>
        }
      />
      <ProductForm product={product} categories={categoryOptions} />
    </>
  );
}
