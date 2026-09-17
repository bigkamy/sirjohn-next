import Link from "next/link";
import { Eye, Package, Plus } from "lucide-react";
import { ProductsTable } from "@/components/admin/products/products-table";
import { RemoveSamplesButton } from "@/components/admin/remove-samples-button";
import { FilterBar, pageParam, Pagination, textParam } from "@/components/admin/ui/filter-bar";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { buttonClass } from "@/components/admin/ui/styles";
import { FlashToast } from "@/components/admin/ui/toast";
import { countSampleProducts, listProductsForAdmin, PRODUCT_SORT_OPTIONS } from "@/lib/admin-products";
import { requirePermission } from "@/lib/auth/dal";
import { getCategories } from "@/lib/products";

export const metadata = { title: "Products" };

const PAGE_SIZE = 20;

export default async function Page({ searchParams }: PageProps<"/admin/products">) {
  const staff = await requirePermission("catalog.view", "/admin/products");
  const canManage = staff.permissions.has("catalog.manage");
  const params = await searchParams;
  const filters = {
    q: textParam(params.q),
    category: textParam(params.category),
    visibility: textParam(params.visibility),
    stock: textParam(params.stock),
    sort: textParam(params.sort),
  };
  const page = pageParam(params.page);
  const saved = textParam(params.saved);

  const [{ products, total }, categories, sampleCount] = await Promise.all([
    listProductsForAdmin({ ...filters, page, pageSize: PAGE_SIZE }),
    getCategories(),
    canManage ? countSampleProducts() : Promise.resolve(0),
  ]);
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      {saved && <FlashToast message={saved === "created" ? "Product created." : "Product saved."} cleanHref="/admin/products" />}
      <PageHeader
        title="Products"
        description={`${total} ${total === 1 ? "product" : "products"}${filtered ? " match these filters" : ""}. Hidden products stay on past orders but can't be bought.`}
        actions={
          <>
            <Link href="/admin/products/preview" className={buttonClass("secondary")}>
              <Eye size={16} aria-hidden /> Preview cards
            </Link>
            {canManage && (
              <>
                {sampleCount > 0 && <RemoveSamplesButton count={sampleCount} />}
                <Link href="/admin/products/new" className={buttonClass("primary")}>
                  <Plus size={16} aria-hidden /> Add product
                </Link>
              </>
            )}
          </>
        }
      />

      <Card>
        <FilterBar
          action="/admin/products"
          search={{ value: filters.q, placeholder: "Search by name, brand, or SKU", label: "Search products" }}
          selects={[
            {
              name: "category",
              label: "Category",
              value: filters.category,
              options: [{ value: "", label: "All categories" }, ...categories.map((category) => ({ value: category, label: category }))],
            },
            {
              name: "visibility",
              label: "Visibility",
              value: filters.visibility,
              options: [
                { value: "", label: "All" },
                { value: "visible", label: "Visible" },
                { value: "hidden", label: "Hidden" },
                { value: "sample", label: "Sample data" },
              ],
            },
            {
              name: "stock",
              label: "Stock",
              value: filters.stock,
              options: [
                { value: "", label: "Any stock" },
                { value: "in_stock", label: "In stock" },
                { value: "low_stock", label: "Low stock" },
                { value: "out_of_stock", label: "Out of stock" },
              ],
            },
            {
              name: "sort",
              label: "Sort by",
              value: filters.sort,
              options: PRODUCT_SORT_OPTIONS.map((option) => ({ value: option.value === "newest" ? "" : option.value, label: option.label })),
            },
          ]}
        />

        {products.length > 0 ? (
          <ProductsTable products={products} canManage={canManage} />
        ) : (
          <EmptyState
            icon={<Package size={22} />}
            title={filtered ? "No products match these filters" : "No products yet"}
            description={filtered ? "Try a different search or clear the filters." : canManage ? "Add your first product to start selling." : undefined}
            action={
              !filtered && canManage ? (
                <Link href="/admin/products/new" className={buttonClass("primary")}>
                  <Plus size={16} aria-hidden /> Add product
                </Link>
              ) : undefined
            }
          />
        )}
        <Pagination action="/admin/products" page={page} pageSize={PAGE_SIZE} total={total} params={filters} />
      </Card>
    </>
  );
}
