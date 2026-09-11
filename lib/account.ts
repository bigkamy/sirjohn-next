import "server-only";
import { requireUser } from "@/lib/auth/dal";
import { listOrders } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export async function getAccountOverview() {
  const user = await requireUser("/account");
  const supabase = await createClient();

  // Filter by user explicitly: RLS also lets admins read every order.
  const [orders, wishlist, addresses, recentOrders] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("wishlist_items").select("product_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    listOrders(5),
  ]);

  return {
    orderCount: orders.count ?? 0,
    wishlistCount: wishlist.count ?? 0,
    addressCount: addresses.count ?? 0,
    recentOrders,
  };
}
