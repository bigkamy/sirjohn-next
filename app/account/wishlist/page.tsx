import Link from "next/link";
import { AccountHeading } from "@/components/account/account-heading";
import { AccountLayout } from "@/components/account/account-layout";
import { WishlistItemActions } from "@/components/wishlist/wishlist-item-actions";
import { requireUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/format";
import { getWishlist } from "@/lib/wishlist";

export const metadata = { title: "Wishlist" };

export default async function Page() {
  const user = await requireUser("/account/wishlist");
  const entries = await getWishlist();

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <AccountHeading eyebrow="Saved for later" title="Wishlist" />

        {entries.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Your wishlist is empty. Tap the heart on any product to save it here.{" "}
            <Link href="/shop" className="font-semibold text-emerald-700">Browse the shop</Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map(({ productId, product }) =>
              product ? (
                <article key={productId} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <Link href={`/product/${product.slug}`}>
                    <img src={product.image} alt={product.name} className="h-48 w-full object-cover" />
                  </Link>
                  <div className="space-y-3 p-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700/80">{product.brand}</p>
                      <Link href={`/product/${product.slug}`} className="mt-1 block text-lg font-semibold text-slate-900 hover:text-emerald-700">
                        {product.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900">{formatPrice(product.price)}</span>
                      {product.originalPrice !== null && product.originalPrice > product.price && (
                        <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {product.stock > 0 ? "In stock" : "Out of stock"}
                    </p>
                    <WishlistItemActions
                      productId={productId}
                      name={product.name}
                      product={{ slug: product.slug, hasOptions: product.hasOptions, inStock: product.stock > 0 }}
                    />
                  </div>
                </article>
              ) : (
                <article key={productId} className="space-y-3 rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  <p>This product is no longer available.</p>
                  <WishlistItemActions productId={productId} name="unavailable product" />
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
