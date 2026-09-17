import { EmptyCart } from "@/components/cart/empty-cart";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { listAddresses } from "@/lib/addresses";
import { requireUser } from "@/lib/auth/dal";
import { getCartQuote } from "@/lib/cart";

export const metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function Page() {
  const user = await requireUser("/checkout");
  const [quote, addresses] = await Promise.all([getCartQuote(), listAddresses()]);

  if (quote.lines.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Secure checkout</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Checkout</h1>
        </div>
        <EmptyCart />
      </main>
    );
  }

  return (
    <CheckoutPage
      quote={quote}
      addresses={addresses}
      prefill={{
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        email: user.email,
        phone: user.profile.phone ?? "",
      }}
    />
  );
}
