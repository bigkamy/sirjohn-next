import { AdminHeading } from "@/components/admin/admin-heading";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/dal";
import { getCategories } from "@/lib/products";

export const metadata = { title: "Add Product" };

export default async function Page() {
  await requireAdmin("/admin/products/new");
  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading title="Add Product" back={{ href: "/admin/products", label: "Back to products" }} />
      <ProductForm categories={categories} />
    </main>
  );
}
