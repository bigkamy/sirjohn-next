import "server-only";
import { getStaffContext } from "@/lib/auth/dal";

/**
 * Local catalog preview: lets the storefront show products that are not on sale yet, so cards
 * and photography can be checked before prices are set. Off unless all three hold:
 *
 *  1. `NODE_ENV` is not "production". A deployed build never takes this branch.
 *  2. The viewer is staff holding `catalog.view`. An anonymous visitor to a dev server — or a
 *     signed-in customer — gets the ordinary storefront, so the preview cannot leak by URL.
 *  3. Row level security still decides what comes back. The hidden rows are readable only
 *     because the products policy is `is_active OR has_permission('catalog.view')`, which
 *     already existed for the admin panel. Nothing about RLS or public access changes, and
 *     the anon role remains unable to read them however the app asks.
 *
 * The production storefront query is untouched: `is_active` AND a price above zero.
 */
export async function catalogPreviewEnabled(): Promise<boolean> {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const staff = await getStaffContext();
    return staff?.permissions.has("catalog.view") ?? false;
  } catch {
    // Called outside a request, where there are no cookies to read a session from — during
    // generateStaticParams, for instance. No session means no preview.
    return false;
  }
}
