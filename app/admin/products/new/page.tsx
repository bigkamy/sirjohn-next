import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { Notice, PageHeader } from "@/components/admin/ui/primitives";
import { requirePermission } from "@/lib/auth/dal";
import { getCategories } from "@/lib/products";

export const metadata = { title: "Add Product" };

export default async function Page() {
  await requirePermission("catalog.manage", "/admin/products/new");
  const categories = await getCategories();

  return (
    <>
      <PageHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} />
      {categories.length === 0 ? (
        <Notice tone="warning">
          Every product needs a category.{" "}
          <Link href="/admin/categories" className="font-semibold underline">
            Create a category
          </Link>{" "}
          first, then come back here.
        </Notice>
      ) : (
        <ProductForm categories={categories} />
      )}
    </>
  );
}
