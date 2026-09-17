import Link from "next/link";
import { QuantityStepper, RemoveFromCartButton } from "@/components/cart/cart-controls";
import { CouponForm } from "@/components/cart/coupon-form";
import { EmptyCart } from "@/components/cart/empty-cart";
import { LineDetails } from "@/components/cart/line-details";
import { PriceRows } from "@/components/cart/price-rows";
import type { CartQuote } from "@/lib/cart";
import { MAX_QUANTITY } from "@/lib/cart-limits";
import { formatPrice } from "@/lib/format";

export function CartPage({ quote }: { quote: CartQuote }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Your cart</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Shopping Cart</h1>
      </div>

      {quote.lines.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-5">
            {quote.lines.map((line) => (
              <div key={line.key} className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
                <img src={line.image} alt={line.name} className="h-32 w-full rounded-2xl object-cover sm:w-32" />

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        <Link href={`/product/${line.slug}`} className="hover:text-brand-700">{line.name}</Link>
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">{line.brand}</p>
                      <LineDetails options={line.options} optionsValid={line.optionsValid} quantity={line.quantity} stock={line.stock} />
                    </div>
                    <RemoveFromCartButton lineKey={line.key} name={line.name} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <QuantityStepper lineKey={line.key} quantity={line.quantity} max={Math.min(line.stock, MAX_QUANTITY)} />
                    <div className="text-xl font-bold text-slate-900">{formatPrice(line.lineTotal)}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Order Summary</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <PriceRows
                subtotal={quote.subtotal}
                shipping={quote.shipping}
                discount={quote.discount}
                couponCode={quote.coupon?.status === "applied" ? quote.coupon.code : null}
              />
            </div>
            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatPrice(quote.total)}</span>
              </div>
            </div>

            <CouponForm coupon={quote.coupon} />

            <Link href="/checkout" className="mt-6 block w-full rounded-full bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-slate-900">Proceed to Checkout</Link>
            <Link href="/shop" className="mt-3 block w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">Continue Shopping</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
