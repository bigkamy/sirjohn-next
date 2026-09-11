import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { DeleteProductButton, VisibilitySwitch } from "@/components/admin/products/product-row-actions";
import { Badge, StockBadge, VisibilityBadge } from "@/components/admin/ui/badge";
import { buttonClass } from "@/components/admin/ui/styles";
import { numericCell, Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import type { AdminProduct } from "@/lib/admin-products";
import { formatPrice } from "@/lib/format";
import { isPlaceholderImage } from "@/lib/product-images";

export function ProductsTable({ products, canManage }: { products: AdminProduct[]; canManage: boolean }) {
  return (
    <Table label="Products">
      <THead>
        <Th>Product</Th>
        <Th className="hidden md:table-cell">SKU</Th>
        <Th className="hidden lg:table-cell">Category</Th>
        <Th className="text-right">Price</Th>
        <Th>Stock</Th>
        <Th>{canManage ? "Visible" : "Visibility"}</Th>
        <Th className="text-right">Actions</Th>
      </THead>
      <TBody>
        {products.map((product) => (
          <tr key={product.id} className="hover:bg-slate-50/70">
            <Td>
              <div className="flex min-w-[220px] items-center gap-3">
                <img src={product.image} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{product.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {product.brand}
                    <span className="lg:hidden"> · {product.category}</span>
                  </p>
                  {(product.isSample || isPlaceholderImage(product.image)) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.isSample && <Badge tone="warning">Sample</Badge>}
                      {isPlaceholderImage(product.image) && <Badge>Placeholder image</Badge>}
                    </div>
                  )}
                </div>
              </div>
            </Td>
            <Td className="hidden font-mono text-xs text-slate-600 md:table-cell">{product.sku ?? "—"}</Td>
            <Td className="hidden lg:table-cell">{product.category}</Td>
            <Td className={numericCell}>
              <span className="font-medium text-slate-900">{formatPrice(product.price)}</span>
              {product.salePrice !== null && <span className="block text-xs text-slate-400 line-through">{formatPrice(product.regularPrice)}</span>}
            </Td>
            <Td>
              <div className="flex flex-col items-start gap-1">
                <span className="tabular-nums text-slate-900">{product.stock}</span>
                <StockBadge stock={product.stock} threshold={product.lowStockThreshold} />
              </div>
            </Td>
            <Td>
              {canManage ? <VisibilitySwitch productId={product.id} name={product.name} isActive={product.isActive} /> : <VisibilityBadge active={product.isActive} />}
            </Td>
            <Td>
              <div className="flex justify-end gap-2">
                {product.isActive && (
                  <Link
                    href={`/product/${product.slug}`}
                    target="_blank"
                    rel="noopener"
                    // Opens a new tab, so preloading it here would be wasted work.
                    prefetch={false}
                    aria-label={`View ${product.name} in the store`}
                    className={buttonClass("ghost", "sm")}
                  >
                    <ExternalLink size={14} aria-hidden />
                  </Link>
                )}
                {canManage && (
                  <>
                    <Link href={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name}`} className={buttonClass("secondary", "sm")}>
                      <Pencil size={13} aria-hidden /> Edit
                    </Link>
                    <DeleteProductButton productId={product.id} name={product.name} />
                  </>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}
