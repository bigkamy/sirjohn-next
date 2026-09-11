"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { refreshShopperState } from "@/components/shopper/shopper-state";
import { NETWORK_ERROR } from "@/lib/messages";
import { moveWishlistItemToCart, removeFromWishlist } from "@/lib/wishlist-actions";

const primaryClass =
  "inline-flex flex-1 items-center justify-center rounded-full bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60";
const secondaryClass =
  "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60";

type WishlistItemActionsProps = {
  productId: number;
  name: string;
  /** Omitted for products that are no longer sold; only Remove is offered. */
  product?: { slug: string; hasOptions: boolean; inStock: boolean };
};

export function WishlistItemActions({ productId, name, product }: WishlistItemActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: (id: number) => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await action(productId).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      if (!result.ok) {
        setError(result.message);
      }
      await refreshShopperState();
    });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {product &&
          (product.hasOptions ? (
            // Options (hand, flex) must be chosen on the product page before it can go in the cart.
            <Link href={`/product/${product.slug}`} className={primaryClass}>
              Choose Options
            </Link>
          ) : (
            <button
              type="button"
              disabled={pending || !product.inStock}
              onClick={() => run(moveWishlistItemToCart)}
              className={primaryClass}
            >
              {product.inStock ? "Move to Cart" : "Out of Stock"}
            </button>
          ))}
        <button
          type="button"
          aria-label={`Remove ${name} from wishlist`}
          disabled={pending}
          onClick={() => run(removeFromWishlist)}
          className={secondaryClass}
        >
          Remove
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
