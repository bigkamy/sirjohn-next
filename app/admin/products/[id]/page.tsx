import { notFound } from "next/navigation";
import { AdminHeading } from "@/components/admin/admin-heading";
import { ProductForm } from "@/components/admin/product-form";
import { getProductForAdmin } from "@/lib/admin-products";
import { getCategories } from "@/lib/products";

export const metadata = { title: "Edit Product" };

export default async function Page({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  // getProductForAdmin checks the admin role before reading.
  const [product, categories] = await Promise.all([getProductForAdmin(Number(id)), getCategories()]);
  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading title="Edit Product" back={{ href: "/admin/products", label: "Back to products" }} description={product.name} />
      <ProductForm product={product} categories={categories} />
    </main>
  );
}
