import { displayName, getCurrentUser, initials } from "@/lib/auth/dal";
import { getCartCount } from "@/lib/cart";
import { getWishlistSlugs } from "@/lib/wishlist";

// Session, cart count, and wishlist for the header and heart icons. Read on the client so
// store pages can stay static. Only ever the requester's own details, and never cached.
export async function GET() {
  const user = await getCurrentUser();
  const [cartCount, wishlist] = await Promise.all([getCartCount(), user ? getWishlistSlugs(user.id) : []]);

  return Response.json(
    {
      signedIn: Boolean(user),
      cartCount,
      wishlist,
      name: user ? displayName(user) : "",
      initials: user ? initials(user) : "",
      avatarUrl: user?.avatarUrl ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
