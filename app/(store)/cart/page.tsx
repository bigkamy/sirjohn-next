import { CartPage } from "@/components/cart/cart-page";
import { getCartQuote } from "@/lib/cart";

export const metadata = {
  title: "Shopping Cart",
  robots: { index: false },
};

export default async function Page() {
  return <CartPage quote={await getCartQuote()} />;
}
