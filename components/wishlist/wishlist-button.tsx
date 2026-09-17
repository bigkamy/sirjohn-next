"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { refreshShopperState, useShopperState } from "@/components/shopper/shopper-state";
import { NETWORK_ERROR } from "@/lib/messages";
import { toggleWishlist } from "@/lib/wishlist-actions";

type WishlistButtonProps = {
  slug: string;
  name: string;
  className: string;
  iconSize?: number;
};

export function WishlistButton({ slug, name, className, iconSize = 16 }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { wishlist } = useShopperState();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const saved = wishlist.includes(slug);

  function toggle() {
    setError(null);
    startTransition(async () => {
      // The server decides whether the shopper is signed in; guests are sent to log in.
      const result = await toggleWishlist(slug).catch(() => null);
      if (result?.needsLogin) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!result?.ok) {
        setError(result?.message ?? NETWORK_ERROR);
      }
      await refreshShopperState();
    });
  }

  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      aria-pressed={saved}
      title={error ?? undefined}
      disabled={pending}
      onClick={toggle}
      className={className}
    >
      <Heart size={iconSize} className={saved ? "fill-brand-600 text-brand-600" : error ? "text-red-500" : undefined} />
      {error && (
        <span role="alert" className="sr-only">
          {error}
        </span>
      )}
    </button>
  );
}
