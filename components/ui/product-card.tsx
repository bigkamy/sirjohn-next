import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

type ProductCardProps = {
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  image: string;
  rating?: number;
  reviews?: number;
  slug: string;
  /** Demo data: shown with a "Sample" label instead of the marketing badge. */
  isSample?: boolean;
};

export function ProductCard({
  name,
  brand,
  price,
  originalPrice,
  badge,
  image,
  rating = 0,
  reviews = 0,
  slug,
  isSample = false,
}: ProductCardProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <article className="group overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(0,0,0,0.12)]">
      <div className="relative overflow-hidden bg-[#f2f4f1]">
        <Link href={`/product/${slug}`}>
          <img
            src={image}
            alt={name}
            className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {isSample ? (
          <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-900">
            Sample
          </span>
        ) : badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-[#0f172a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            {badge}
          </span>
        ) : null}
        <WishlistButton
          slug={slug}
          name={name}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-60"
        />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700/80">
              {brand}
            </p>
            <Link href={`/product/${slug}`} className="mt-2 block text-lg font-semibold text-slate-900 hover:text-emerald-700">
              {name}
            </Link>
          </div>
        </div>

        {reviews > 0 && (
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="fill-current" size={14} />
            <span className="text-sm font-medium text-slate-600">
              {rating.toFixed(1)} <span className="text-slate-400">({reviews})</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-900">{formatPrice(price)}</span>
          {originalPrice && originalPrice > price ? (
            <>
              <span className="text-base text-slate-400 line-through">{formatPrice(originalPrice)}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                {Math.round(((originalPrice - price) / originalPrice) * 100)}%
              </span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <AddToCartButton
            slug={slug}
            optionsHref={`/product/${slug}`}
            wrapperClassName="flex-1"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <ShoppingBag size={16} />
            Add to Cart
          </AddToCartButton>
        </div>
      </div>
    </article>
  );
}
