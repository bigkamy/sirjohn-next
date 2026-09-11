import Link from "next/link";
import { AdminHeading, adminButtonClass, adminPrimaryButtonClass } from "@/components/admin/admin-heading";
import { ProductVisibilityToggle } from "@/components/admin/product-visibility-toggle";
import { RemoveSamplesButton } from "@/components/admin/remove-samples-button";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import { FormAlert } from "@/components/auth/form-controls";
import type { AdminProduct } from "@/lib/admin-products";
import { formatPrice } from "@/lib/format";
import { isPlaceholderImage } from "@/lib/product-images";

const pill = "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]";

export function AdminProducts({ products, saved }: { products: AdminProduct[]; saved: boolean }) {
  const sampleCount = products.filter((product) => product.isSample).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading title="Products" back={{ href: "/admin", label: "Back to dashboard" }} description="Hidden products stay on past orders but can't be bought.">
        {sampleCount > 0 && <RemoveSamplesButton count={sampleCount} />}
        <Link href="/admin/categories" className={adminButtonClass}>Categories</Link>
        <Link href="/admin/products/new" className={adminPrimaryButtonClass}>Add Product</Link>
      </AdminHeading>

      {saved && (
        <div className="mb-6">
          <FormAlert message="Product saved." />
        </div>
      )}

      <div className="overflow-x-auto rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="bg-[#f7f9f7] text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr className="border-t border-slate-200">
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No products yet.</td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-200 align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    <div>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-500">
                        {product.brand}
                        {product.options.length > 0 && ` · ${product.options.map((group) => group.name).join(", ")}`}
                      </div>
                      {(product.isSample || isPlaceholderImage(product.image)) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {product.isSample && <span className={`${pill} bg-amber-100 text-amber-800`}>Sample</span>}
                          {isPlaceholderImage(product.image) && <span className={`${pill} bg-slate-100 text-slate-600`}>Placeholder image</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{product.category}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  <StockAdjuster productId={product.id} name={product.name} stock={product.stock} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {product.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-start gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      aria-label={`Edit ${product.name}`}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Edit
                    </Link>
                    <ProductVisibilityToggle productId={product.id} name={product.name} isActive={product.isActive} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
