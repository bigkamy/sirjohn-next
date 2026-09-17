"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { siteImages } from "@/lib/site-images";

/**
 * The built-in hero, shown until the first slide is added at /admin/homepage. Its copy is
 * generated from the live catalog, so it never overstates what the shop actually sells.
 */
export function HeroFallback({ lowestPrice, biggestDiscount }: { lowestPrice: number | null; biggestDiscount: number }) {
  const heroSlides = [
    {
      title: "Engineered for Best Performance",
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

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % 3);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = heroSlides[heroIndex];

  return (
    <section className="relative overflow-hidden bg-[#fbf8f3]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-[#eee7d9] bg-white shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
          <div className="grid min-h-[620px] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                <Star size={12} className="fill-current" /> New Season 2026
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
                {currentSlide.title}
              </h1>
              <p className="mt-5 text-xl font-medium text-brand-700">{currentSlide.subtitle}</p>
              <p className="mt-4 max-w-lg text-base leading-8 text-slate-600">{currentSlide.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
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
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-200">Signature gear</p>
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
  );
}
