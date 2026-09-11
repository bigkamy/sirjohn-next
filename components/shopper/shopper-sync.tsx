"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { refreshShopperState } from "@/components/shopper/shopper-state";

// Login, logout, and checkout all finish with a navigation, so re-reading on every
// route change keeps the header in step with the server.
export function ShopperSync() {
  const pathname = usePathname();

  useEffect(() => {
    refreshShopperState();
  }, [pathname]);

  return null;
}
