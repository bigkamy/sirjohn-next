import { useSyncExternalStore } from "react";

// Client-side snapshot of /api/shopper shared by the header and heart icons. It is
// refreshed on navigation (ShopperSync) and after every cart or wishlist change.

export type ShopperState = {
  signedIn: boolean;
  cartCount: number;
  wishlist: string[];
  /** Who is signed in, for the greeting in the top band. Empty for visitors. */
  name: string;
  initials: string;
  avatarUrl: string | null;
};

const initialState: ShopperState = { signedIn: false, cartCount: 0, wishlist: [], name: "", initials: "", avatarUrl: null };

let state = initialState;
let latestRequest = 0;
const listeners = new Set<() => void>();

export async function refreshShopperState() {
  const request = ++latestRequest;
  try {
    const response = await fetch("/api/shopper", { cache: "no-store" });
    const next = response.ok ? ((await response.json()) as ShopperState) : null;
    // Ignore responses that were overtaken by a newer refresh.
    if (next && request === latestRequest) {
      state = next;
      listeners.forEach((listener) => listener());
    }
  } catch {
    // Keep the last known state; the next navigation retries.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useShopperState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initialState,
  );
}
