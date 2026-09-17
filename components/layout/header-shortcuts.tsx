"use client";

import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { IconTooltip } from "@/components/layout/icon-tooltip";
import { useShopperState } from "@/components/shopper/shopper-state";

const iconLinkClass =
  "relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700";
const badgeClass =
  "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white";

const badgeText = (count: number) => (count > 99 ? "99+" : count);

/** Wishlist and cart icons with live counts. */
export function HeaderShortcuts() {
  const { cartCount, wishlist } = useShopperState();

  return (
    <>
      <IconTooltip label="Wishlist">
        <Link
          href="/account/wishlist"
          aria-label={wishlist.length > 0 ? `Wishlist, ${wishlist.length} items` : "Wishlist"}
          className={iconLinkClass}
        >
          <Heart size={18} />
          {wishlist.length > 0 && <span className={`${badgeClass} bg-emerald-600`}>{badgeText(wishlist.length)}</span>}
        </Link>
      </IconTooltip>
      <IconTooltip label="Cart">
        <Link href="/cart" aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"} className={iconLinkClass}>
          <ShoppingCart size={18} />
          {cartCount > 0 && <span className={`${badgeClass} bg-[#0f172a]`}>{badgeText(cartCount)}</span>}
        </Link>
      </IconTooltip>
    </>
  );
}
