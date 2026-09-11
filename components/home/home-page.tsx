"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { ProductCard } from "@/components/ui/product-card";
import { formatPrice } from "@/lib/format";
import type { CategorySummary, Product } from "@/lib/products";
import { siteConfig } from "@/lib/site-config";
import { siteImages } from "@/lib/site-images";

// Claims here are limited to what the site actually does; returns terms live in the policy.
const standardBenefits = [
  { icon: ShieldCheck, title: "Secure Checkout", text: "Every order is priced and confirmed securely on our servers" },
  { icon: RotateCcw, title: "Returns", text: "See our returns & refund policy for details" },
  { icon: ShoppingBag, title: "Golf Essentials", text: "Clubs, bags, apparel, and accessories in one place" },
];

const banners = [
  { eyebrow: "Golf clubs", title: "Drivers, woods & wedges", href: "/shop?category=Clubs", image: siteImages.banners.clubs },
  { eyebrow: "Apparel", title: "Performance golf apparel", href: "/shop?category=Apparel", image: siteImages.banners.apparel },
  { eyebrow: "Golf bags", title: "Carry and cart bags", href: "/shop?category=Bags", image: siteImages.banners.bags },
];

/** Shown where an image hasn't been set yet, so no unrelated stock photo stands in. */
const plainPanel = "bg-gradient-to-br from-[#0f172a] via-[#123a2f] to-emerald-700";

const discountPercent = (product: Product) =>
  product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

type HomePageProps = { products: Product[]; categories: CategorySummary[]; freeShippingOver: number | null };

export function HomePage({ products, categories, freeShippingOver }: HomePageProps) {
  // Every figure below comes from the live catalog, so nothing goes stale or overpromises.
  const lowestPrice = products.length ? Math.min(...products.map((product) => product.price)) : null;
  const biggestDiscount = Math.max(0, ...products.map(discountPercent));

  const heroSlides = [
    {
      title: "Engineered for Performance",
      subtitle: "Play every shot with precision.",
      description: "Premium golf equipment crafted for distance, control, and confidence on every round.",
      cta: "Shop Now",
      detail: lowestPrice === null ? "Premium golf equipment" : `Starting from ${formatPrice(lowestPrice)}`,
    },
    {
      title: "Golf Gear That Moves With You",
      subtitle: "Built for modern golfers.",
      description: "From tournament-level drivers to luxury travel bags, we equip your complete game.",
      cta: "Explore Collection",
      detail: "Clubs, bags, apparel, and accessories",
    },
    {
      title: "Better Performance Starts Here",
      subtitle: "Clubs, apparel, and accessories.",
      description: "Discover the premium essentials trusted by players who love the game as much as you do.",
      cta: "View Deals",
      detail: biggestDiscount > 0 ? `Up to ${biggestDiscount}% off selected gear` : "Golf equipment for every round",
    },
  ].map((slide, index) => ({ ...slide, image: siteImages.hero[index] ?? siteImages.hero[0] }));

  const benefits = [
    freeShippingOver === null
      ? { icon: Truck, title: "Delivery", text: "Shipping charges are shown at checkout" }
      : { icon: Truck, title: "Free Delivery", text: `Free shipping on eligible orders over ${formatPrice(freeShippingOver)}` },
    ...standardBenefits,
  ];

  const tabs = useMemo(() => {
    const featured = products.filter((product) => product.badge);
    return [
      { label: "Featured", items: (featured.length ? featured : products).slice(0, 4) },
      { label: "New Arrivals", items: products.slice(0, 4) },
      { label: "On Sale", items: products.filter((product) => discountPercent(product) > 0).slice(0, 4) },
    ].filter((tab) => tab.items.length > 0);
  }, [products]);

  const productCounts = useMemo(
    () =>
      products.reduce<Record<string, number>>((counts, product) => {
        counts[product.category] = (counts[product.category] ?? 0) + 1;
        return counts;
      }, {}),
    [products],
  );

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);

  const deal = useMemo(
    () =>
      products
        .filter((product) => product.stock > 0 && discountPercent(product) > 0)
        .sort((a, b) => discountPercent(b) - discountPercent(a))[0],
    [products],
  );

  const [activeTab, setActiveTab] = useState("Featured");
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % 3);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const visibleProducts = (tabs.find((tab) => tab.label === activeTab) ?? tabs[0])?.items ?? [];
  const currentSlide = heroSlides[heroIndex];

  return (
    <>
      <section className="relative overflow-hidden bg-[#f6f9f4]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-[#e4ebdf] bg-white shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
            <div className="grid min-h-[620px] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  <Star size={12} className="fill-current" /> New Season 2026
                </div>
                <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
                  {currentSlide.title}
                </h1>
                <p className="mt-5 text-xl font-medium text-emerald-700">{currentSlide.subtitle}</p>
                <p className="mt-4 max-w-lg text-base leading-8 text-slate-600">{currentSlide.description}</p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                    {currentSlide.cta} <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="mt-8 text-sm font-medium text-slate-500">{currentSlide.detail}</div>
              </div>

              <div className="relative h-full min-h-[400px] overflow-hidden">
                <img src={currentSlide.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09111b]/70 via-[#09111b]/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">Signature gear</p>
                    <p className="mt-1 text-xl font-semibold text-white">{siteConfig.name}</p>
                  </div>
                  <button type="button" aria-label="Previous slide" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white" onClick={() => setHeroIndex((heroIndex - 1 + heroSlides.length) % heroSlides.length)}>
                    <ChevronLeft size={18} />
                  </button>
                  <button type="button" aria-label="Next slide" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white" onClick={() => setHeroIndex((heroIndex + 1) % heroSlides.length)}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0f172a] py-5 text-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                <Icon size={18} />
              </div>
              <h3 className="mb-1 text-base font-semibold">{title}</h3>
              <p className="text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {categories.length > 0 && (
          <section className="mb-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Shop by category</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Built for every round</h2>
              </div>
              <Link href="/shop" className="hidden text-sm font-semibold text-slate-700 hover:text-emerald-700 sm:inline-flex">View all</Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(0, 6).map((category) => {
                const count = productCounts[category.name] ?? 0;
                return (
                  <Link key={category.name} href={`/shop?category=${encodeURIComponent(category.name)}`} className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="h-80 w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className={`h-80 w-full transition duration-500 group-hover:scale-105 ${plainPanel}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09111b]/80 via-[#09111b]/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">
                        {count === 0 ? "Coming soon" : `${count} ${count === 1 ? "Product" : "Products"}`}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold">{category.name}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Featured products</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Performance picks</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  aria-pressed={activeTab === tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.label ? "bg-[#0f172a] text-white" : "bg-[#eef3ee] text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <p className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-slate-600">New products are on their way.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-20 grid gap-6 lg:grid-cols-3">
          {banners.map((banner) => (
            <div key={banner.title} className="group relative overflow-hidden rounded-[28px]">
              {banner.image ? (
                <img src={banner.image} alt="" className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className={`h-72 w-full transition duration-500 group-hover:scale-105 ${plainPanel}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09111b]/80 via-[#09111b]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-200">{banner.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-bold">{banner.title}</h3>
                <Link href={banner.href} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  Shop Now <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-20">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Every golfer’s choice</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Find your fit</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {["Beginner", "Intermediate", "Professional", "Junior", "Women", "Training"].map((fit, index) => (
              <div key={fit} className="rounded-[26px] border border-slate-200 bg-[#f7f9f7] p-6 text-center transition hover:border-emerald-300 hover:bg-white hover:shadow-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-700">{index + 1}</div>
                <h3 className="text-lg font-bold text-slate-900">{fit}</h3>
                <p className="mt-2 text-sm text-slate-500">Curated for your level</p>
              </div>
            ))}
          </div>
        </section>

        {brands.length > 0 && (
          <section className="mb-20 rounded-[32px] border border-slate-200 bg-[#f4f6f1] p-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Shop by brands</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Trusted names</h2>
              </div>
              <Link href="/shop" className="text-sm font-semibold text-slate-700 hover:text-emerald-700">Browse all brands</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              {brands.map((brand) => (
                <Link
                  key={brand}
                  href={`/shop?brand=${encodeURIComponent(brand)}`}
                  className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-center text-lg font-black tracking-[0.15em] text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {brand}
                </Link>
              ))}
            </div>
          </section>
        )}

        {deal && (
          <section className="mb-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Deal of the day</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Best value right now</h2>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Save {discountPercent(deal)}%
              </div>
            </div>

            <div className="grid gap-8 rounded-[32px] bg-[#0f172a] p-8 text-white lg:grid-cols-[1fr_1.2fr]">
              <img src={deal.image} alt={deal.name} className="h-full min-h-[300px] rounded-[24px] object-cover" />
              <div className="flex flex-col justify-center">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{deal.brand}</p>
                <h3 className="mt-4 text-4xl font-black tracking-tight">{deal.name}</h3>
                <div className="mt-5 flex items-center gap-4">
                  <span className="text-3xl font-bold">{formatPrice(deal.price)}</span>
                  <span className="text-xl text-slate-400 line-through">{formatPrice(deal.originalPrice)}</span>
                </div>
                <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">{deal.shortDescription || deal.description}</p>
                <Link href={`/product/${deal.slug}`} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400">
                  Shop Now <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {siteConfig.testimonials.length > 0 && (
          <section className="mb-20">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Customer reviews</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Loved by golfers</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {siteConfig.testimonials.map((item) => (
                <div key={item.name} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="mb-4 flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={`${item.name}-${i}`} className="fill-current" size={16} />
                    ))}
                  </div>
                  <p className="text-lg leading-8 text-slate-700">“{item.review}”</p>
                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-500">Purchased: {item.product}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {siteImages.story.length > 0 && (
          <section className="mb-20">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Golf journey</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Follow our story</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {siteImages.story.map((image, index) => (
                <div key={image} className="group relative overflow-hidden rounded-[24px]">
                  <img src={image} alt={`Golf lifestyle ${index + 1}`} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09111b]/70 via-transparent to-transparent" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-20 rounded-[32px] bg-[#0f172a] p-8 text-white lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Exclusive offers</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Get the latest golf drops and specials</h2>
            </div>
            <NewsletterForm />
          </div>
        </section>
      </main>
    </>
  );
}
