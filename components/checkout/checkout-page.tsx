"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormAlert, FormField } from "@/components/auth/form-controls";
import { LineDetails } from "@/components/cart/line-details";
import { PriceRows } from "@/components/cart/price-rows";
import type { Address } from "@/lib/addresses";
import type { CartQuote } from "@/lib/cart";
import { PAYMENT_METHODS, paymentMethodLabels } from "@/lib/checkout";
import { placeOrder } from "@/lib/checkout-actions";
import { couponStatusMessage } from "@/lib/coupons";
import { formatPrice } from "@/lib/format";

type Prefill = { firstName: string; lastName: string; email: string; phone: string };

type DeliveryField = {
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  type?: string;
  inputMode?: "numeric";
  span?: boolean;
};

const deliveryFields: DeliveryField[] = [
  { name: "firstName", label: "First Name", placeholder: "John", autoComplete: "given-name" },
  { name: "lastName", label: "Last Name", placeholder: "Doe", autoComplete: "family-name" },
  { name: "email", label: "Email", placeholder: "john@example.com", autoComplete: "email", type: "email" },
  { name: "phone", label: "Phone", placeholder: "+91 90000 00000", autoComplete: "tel", type: "tel" },
  { name: "address", label: "Address", placeholder: "22 Fairway Avenue", autoComplete: "street-address", span: true },
  { name: "city", label: "City", placeholder: "Bengaluru", autoComplete: "address-level2" },
  { name: "state", label: "State", placeholder: "Karnataka", autoComplete: "address-level1" },
  { name: "pinCode", label: "PIN Code", placeholder: "560001", autoComplete: "postal-code", inputMode: "numeric" },
];

const NEW_ADDRESS = "new";

// Fills the delivery form from a saved address.
function addressFields(address: Address): Record<string, string> {
  const [firstName = "", ...rest] = address.fullName.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
    phone: address.phone,
    address: [address.line1, address.line2].filter(Boolean).join(", "),
    city: address.city,
    state: address.state,
    pinCode: address.postalCode,
  };
}

type CheckoutPageProps = { quote: CartQuote; prefill: Prefill; addresses: Address[] };

export function CheckoutPage({ quote, prefill, addresses }: CheckoutPageProps) {
  const [state, formAction, pending] = useActionState(placeOrder, undefined);
  const [shippingMethod, setShippingMethod] = useState(quote.shippingMethod);
  const [addressId, setAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? NEW_ADDRESS,
  );

  const selectedAddress = addresses.find((address) => address.id === addressId);
  // After a failed submit, keep what was typed — as long as the same address is still selected.
  const echoed = state?.values?.addressId === addressId ? state.values : undefined;
  const defaults: Record<string, string | undefined> = {
    ...prefill,
    ...(selectedAddress ? addressFields(selectedAddress) : {}),
    ...echoed,
  };
  const errors = state?.fieldErrors;

  // Display only — place_order re-prices the whole order on the server.
  const shipping = quote.shippingOptions.find((option) => option.code === shippingMethod)?.price ?? quote.shipping;
  const total = quote.subtotal - quote.discount + shipping;
  const appliedCoupon = quote.coupon?.status === "applied" ? quote.coupon.code : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Secure checkout</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Checkout</h1>
      </div>

      <form action={formAction} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Delivery Details</h2>

            {addresses.length > 0 && (
              <fieldset className="mb-5 grid gap-3 md:grid-cols-2">
                <legend className="sr-only">Saved addresses</legend>
                {addresses.map((address) => (
                  <label key={address.id} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-[#f7f9f7] p-4 text-sm">
                    <input
                      type="radio"
                      name="addressChoice"
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1 h-4 w-4 text-emerald-600"
                    />
                    <span>
                      <span className="font-semibold text-slate-900">{address.label}</span>
                      {address.isDefault && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Default</span>
                      )}
                      <span className="mt-1 block text-slate-500">
                        {address.fullName}, {address.line1}, {address.city} {address.postalCode}
                      </span>
                    </span>
                  </label>
                ))}
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-[#f7f9f7] p-4 text-sm">
                  <input
                    type="radio"
                    name="addressChoice"
                    checked={addressId === NEW_ADDRESS}
                    onChange={() => setAddressId(NEW_ADDRESS)}
                    className="h-4 w-4 text-emerald-600"
                  />
                  <span className="font-semibold text-slate-900">Use a new address</span>
                </label>
              </fieldset>
            )}
            <input type="hidden" name="addressId" value={addressId} />

            {/* Remount the fields when the address changes so they pick up its values. */}
            <div key={addressId} className="grid gap-4 md:grid-cols-2">
              {deliveryFields.map((field) => (
                <FormField
                  key={field.name}
                  className={field.span ? "md:col-span-2" : ""}
                  label={field.label}
                  name={field.name}
                  type={field.type ?? "text"}
                  inputMode={field.inputMode}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                  required
                  defaultValue={defaults[field.name]}
                  errors={errors?.[field.name]}
                />
              ))}
            </div>

            {addressId === NEW_ADDRESS && (
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="saveAddress"
                  defaultChecked={addresses.length === 0}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                Save this address to my account
              </label>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Shipping Method</h2>
            <div className="space-y-3">
              {quote.shippingOptions.map((option) => (
                <label key={option.code} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#f7f9f7] p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={option.code}
                      checked={shippingMethod === option.code}
                      onChange={() => setShippingMethod(option.code)}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">{option.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{option.description}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{option.price === 0 ? "Free" : formatPrice(option.price)}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-900">Payment</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label key={method} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-[#f7f9f7] p-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    required
                    defaultChecked={state?.values?.paymentMethod === method}
                    className="h-4 w-4 text-emerald-600"
                  />
                  <span className="font-medium text-slate-700">{paymentMethodLabels[method]}</span>
                </label>
              ))}
            </div>
            {errors?.paymentMethod && <p className="mt-2 text-xs text-red-600">{errors.paymentMethod[0]}</p>}
          </div>
        </section>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Order Review</h2>
          <div className="mt-6 space-y-4">
            {quote.lines.map((line) => (
              <div key={line.key} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f9f7] p-3">
                <div>
                  <div className="font-semibold text-slate-900">{line.name}</div>
                  <div className="text-sm text-slate-500">Qty: {line.quantity}</div>
                  <LineDetails options={line.options} optionsValid={line.optionsValid} quantity={line.quantity} stock={line.stock} />
                </div>
                <div className="font-semibold text-slate-700">{formatPrice(line.lineTotal)}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <PriceRows subtotal={quote.subtotal} shipping={shipping} discount={quote.discount} couponCode={appliedCoupon} />
          </div>

          {quote.coupon && !appliedCoupon && (
            <p className="mt-3 text-sm text-red-600">
              Coupon {quote.coupon.code}: {couponStatusMessage(quote.coupon.status, quote.coupon.minSubtotal)}
            </p>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between text-xl font-black text-slate-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {state?.error && (
            <div className="mt-6">
              <FormAlert error={state.error} />
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 block w-full rounded-full bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-slate-900 disabled:opacity-60"
          >
            {pending ? "Placing order…" : "Place Order"}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500">
            By placing your order you agree to our{" "}
            <Link href="/policies/terms" className="font-semibold text-emerald-700">Terms &amp; Conditions</Link> and{" "}
            <Link href="/policies/privacy" className="font-semibold text-emerald-700">Privacy Policy</Link>.
          </p>
        </aside>
      </form>
    </main>
  );
}
