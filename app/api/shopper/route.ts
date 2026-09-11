import { getCurrentUser } from "@/lib/auth/dal";
import { getCartCount } from "@/lib/cart";
import { getWishlistSlugs } from "@/lib/wishlist";

// Session, cart count, and wishlist for the header and heart icons. Read on the client so
// store pages can stay static.
export async function GET() {
  const user = await getCurrentUser();
  const [cartCount, wishlist] = await Promise.all([getCartCount(), user ? getWishlistSlugs(user.id) : []]);

  return Response.json(
    { signedIn: Boolean(user), cartCount, wishlist },
    { headers: { "Cache-Control": "no-store" } },
  );
}
