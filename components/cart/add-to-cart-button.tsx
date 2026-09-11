"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { refreshShopperState } from "@/components/shopper/shopper-state";
import { addToCart } from "@/lib/cart-actions";
import { NETWORK_ERROR } from "@/lib/messages";
import type { SelectedOptions } from "@/lib/product-options";

type AddToCartButtonProps = {
  slug: string;
  quantity?: number;
  options?: SelectedOptions;
  /** Navigate here once the item is added — "/checkout" for Buy Now. */
  redirectTo?: string;
  /** Where to send the shopper if the product needs options chosen first (e.g. from a card). */
  optionsHref?: string;
  disabled?: boolean;
  className: string;
  wrapperClassName?: string;
  children: ReactNode;
};

export function AddToCartButton({
  slug,
  quantity = 1,
  options,
  redirectTo,
  optionsHref,
  disabled,
  className,
  wrapperClassName,
  children,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!added) {
      return;
    }
    const timer = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [added]);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addToCart(slug, quantity, options).catch(() => null);
      if (!result) {
        setError(NETWORK_ERROR);
        return;
      }
      if (!result.ok) {
        if (result.needsOptions && optionsHref) {
          router.push(optionsHref);
        } else {
          setError(result.message);
        }
        return;
      }
      await refreshShopperState();
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        setAdded(true);
      }
    });
  }

  return (
    <div className={wrapperClassName}>
      <button type="button" onClick={handleClick} disabled={disabled || pending} className={className}>
        {pending ? "Adding…" : added ? "Added to Cart ✓" : children}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
