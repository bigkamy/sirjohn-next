"use client";

import Link from "next/link";
import { Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { Fragment, useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductCard } from "@/components/ui/product-card";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { MAX_QUANTITY } from "@/lib/cart-limits";
import { formatPrice } from "@/lib/format";
import type { SelectedOptions } from "@/lib/product-options";
import type { Product } from "@/lib/products";
import { freeShippingLabel } from "@/lib/shipping-copy";

const TABS = ["Description", "Specifications", "Shipping"] as const;

type ProductDetailPageProps = { product: Product; related: Product[]; freeShippingOver: number | null };

export function ProductDetailPage({ product, related, freeShippingOver }: ProductDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(product.gallery[0]);
  const [quantity, setQuantity] = useState(1);
  // Checked on the server when adding to cart; nothing is preselected so buyers choose deliberately.
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Description");
  // Stock shown here can lag behind the database; the server clamps to live stock anyway.
  const outOfStock = product.stock < 1;
  const maxQuantity = Math.max(1, Math.min(product.stock, MAX_QUANTITY));
  const savePercent =
    product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-emerald-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-emerald-700">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{product.name}</span>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <img src={selectedImage} alt={product.name} className="h-[560px] w-full object-cover" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {product.gallery.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Show image ${index + 1}`}
                onClick={() => setSelectedImage(image)}
                className={`overflow-hidden rounded-2xl border ${selectedImage === image ? "border-emerald-500" : "border-slate-200"}`}
              >
                <img src={image} alt="" className="h-28 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">{product.brand}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{product.name}</h1>
          </div>

          {product.isSample && (
            <p role="note" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sample product for testing. Its details and photos will be replaced before launch.
            </p>
          )}

          {product.reviews > 0 && (
            <div className="flex items-center gap-2 text-amber-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className={index < Math.round(product.rating) ? "fill-current" : ""} size={16} />
              ))}
              <span className="ml-2 text-sm font-medium text-slate-600">
                {product.rating.toFixed(1)} ({product.reviews} Reviews)
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-4xl font-black text-slate-900">{formatPrice(product.price)}</span>
            {savePercent > 0 && (
              <>
                <span className="text-xl text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                  Save {savePercent}%
                </span>
              </>
            )}
          </div>

          <p className="text-base leading-7 text-slate-600">{product.shortDescription || product.description}</p>

          <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            {product.options.map((group) => (
              <div key={group.name}>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected = selectedOptions[group.name] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedOptions((current) => ({ ...current, [group.name]: value }))}
                        className={`rounded-full border px-4 py-2 text-sm font-medium ${selected ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-700"}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f7f9f7] p-3">
              <span className="text-sm font-medium text-slate-600">Quantity</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center text-lg font-semibold text-slate-900">{quantity}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(value + 1, maxQuantity))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <AddToCartButton
              slug={product.slug}
              quantity={quantity}
              options={selectedOptions}
              disabled={outOfStock}
              wrapperClassName="flex-1"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0f172a] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <ShoppingBag size={17} /> {outOfStock ? "Out of Stock" : "Add to Cart"}
            </AddToCartButton>
            <AddToCartButton
              slug={product.slug}
              quantity={quantity}
              options={selectedOptions}
              disabled={outOfStock}
              redirectTo="/checkout"
              className="rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Buy Now
            </AddToCartButton>
            <WishlistButton
              slug={product.slug}
              name={product.name}
              iconSize={18}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 disabled:opacity-60"
            />
          </div>

          <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-[#f7f9f7] p-4 text-sm text-slate-600 md:grid-cols-2">
            <div className="flex items-center gap-2"><Truck size={16} className="text-emerald-700" /> {freeShippingLabel(freeShippingOver)}</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-700" /> Secure checkout</div>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div role="tablist" className="grid gap-4 border-b border-slate-200 text-sm font-medium text-slate-500 md:flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-2 py-3 hover:border-emerald-700 hover:text-emerald-700 ${activeTab === tab ? "border-emerald-700 text-emerald-700" : "border-transparent"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-8 max-w-3xl space-y-4 text-base leading-8 text-slate-600">
          {activeTab === "Description" && <p className="whitespace-pre-line">{product.description || product.shortDescription}</p>}

          {activeTab === "Specifications" && (
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[200px_1fr]">
              <dt className="font-semibold text-slate-900">Brand</dt>
              <dd>{product.brand}</dd>
              <dt className="font-semibold text-slate-900">Category</dt>
              <dd>{product.category}</dd>
              {product.options.map((group) => (
                <Fragment key={group.name}>
                  <dt className="font-semibold text-slate-900">{group.name}</dt>
                  <dd>{group.values.join(", ")}</dd>
                </Fragment>
              ))}
            </dl>
          )}

          {activeTab === "Shipping" && (
            <>
              <p>{freeShippingLabel(freeShippingOver)}.</p>
              <p>Delivery options, times, and charges for your address are shown at checkout before you place your order.</p>
            </>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">You may also like</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Related products</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
