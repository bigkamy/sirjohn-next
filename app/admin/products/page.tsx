import { AdminProducts } from "@/components/admin/admin-products";
import { listProductsForAdmin } from "@/lib/admin-products";

export const metadata = { title: "Products" };

export default async function Page({ searchParams }: PageProps<"/admin/products">) {
  // listProductsForAdmin checks the admin role before reading.
  const [products, { saved }] = await Promise.all([listProductsForAdmin(), searchParams]);
  return <AdminProducts products={products} saved={Boolean(saved)} />;
}
