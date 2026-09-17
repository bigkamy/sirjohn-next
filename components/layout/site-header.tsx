import Link from "next/link";
import { CircleUserRound, Search } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HeaderAuthLinks } from "@/components/layout/header-auth-links";
import { HeaderShortcuts } from "@/components/layout/header-shortcuts";
import { IconTooltip } from "@/components/layout/icon-tooltip";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { navIcon } from "@/components/layout/nav-icons";
import { ShopperSync } from "@/components/shopper/shopper-sync";
import { siteConfig } from "@/lib/site-config";

/** The first categories by display order (set in /admin/categories) appear in the menu. */
const MENU_CATEGORIES = 4;

/**
 * Categories deliberately kept out of the menu. Applied after the slice above rather than
 * before, so leaving one out doesn't pull the next category up to take its place — the menu
 * gets shorter instead of quietly swapping in Footwear or Balls.
 */
const MENU_EXCLUDED_CATEGORIES = new Set(["Clubs", "Apparel", "Accessories"]);

export function SiteHeader({ categories }: { categories: string[] }) {
  const { contact, country } = siteConfig;
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...categories
      .slice(0, MENU_CATEGORIES)
      .filter((category) => !MENU_EXCLUDED_CATEGORIES.has(category))
      .map((category) => ({
        label: category,
        href: `/shop?category=${encodeURIComponent(category)}`,
      })),
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* Outside the sticky header on purpose: a sticky element can only travel inside its
          own parent, so the bar that scrolls away has to be a sibling, not a child. */}
      <div className="border-b border-[#f1ece3] bg-[#0f172a] text-xs text-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            {country && <span>📍 Store Location: {country}</span>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            {contact.phone && (
              <>
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:text-brand-300">
                  Call Us: {contact.phone}
                </a>
                <span>•</span>
              </>
            )}
            <HeaderAuthLinks />
          </div>
        </div>
      </div>

      {/* Stays put while the page scrolls. z-40 keeps it — and the mobile menu that drops
          below it — above page content; the blur creates its own stacking context, so the
          menu's z-index alone isn't enough. */}
      <header className="sticky top-0 z-40 border-b border-[#ece5d8] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <MobileMenu items={navItems} categories={categories} />

            <Link href="/" aria-label={`${siteConfig.name} home`}>
              <BrandLogo />
            </Link>

            {/* From lg, where the menu button disappears: below that, search lives in the menu
                panel, and showing both left the row too narrow to fit. */}
            <form action="/shop" role="search" className="hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-[#faf8f5] px-3 py-2 lg:flex">
              <select name="category" aria-label="Category" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none">
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                type="search"
                name="q"
                aria-label="Search products"
                placeholder="Search golf products..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <IconTooltip label="Search">
                <button type="submit" aria-label="Search" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-white">
                  <Search size={16} />
                </button>
              </IconTooltip>
            </form>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ShopperSync />
              <HeaderShortcuts />
              <IconTooltip label="My account">
                <Link href="/account" aria-label="My account" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                  <CircleUserRound size={18} />
                </Link>
              </IconTooltip>
            </div>
          </div>
        </div>

        <nav aria-label="Main" className="border-t border-[#f1ece3] bg-[#faf8f4]">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 overflow-x-auto px-4 py-4 text-sm font-medium text-slate-700 sm:justify-between lg:px-8">
            {navItems.map((item) => {
              const Icon = navIcon(item.label);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group inline-flex items-center gap-2 whitespace-nowrap transition hover:text-brand-700"
                >
                  <Icon size={16} aria-hidden className="shrink-0 text-brand-700/70 transition group-hover:text-brand-700" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
    </>
  );
}
