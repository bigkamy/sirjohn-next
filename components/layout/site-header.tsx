import Link from "next/link";
import { CircleUserRound, Search } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HeaderAuthLinks } from "@/components/layout/header-auth-links";
import { HeaderShortcuts } from "@/components/layout/header-shortcuts";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ShopperSync } from "@/components/shopper/shopper-sync";
import { siteConfig } from "@/lib/site-config";

/** The first categories by display order (set in /admin/categories) appear in the menu. */
const MENU_CATEGORIES = 4;

export function SiteHeader({ categories }: { categories: string[] }) {
  const { contact, country } = siteConfig;
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...categories.slice(0, MENU_CATEGORIES).map((category) => ({
      label: category,
      href: `/shop?category=${encodeURIComponent(category)}`,
    })),
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    // z-40 keeps the header — and the mobile menu that drops below it — above page content;
    // the blur creates its own stacking context, so the menu's z-index alone isn't enough.
    <header className="relative z-40 border-b border-[#e8ece7] bg-white/95 backdrop-blur-sm">
      <div className="border-b border-[#edf0ec] bg-[#0f172a] text-xs text-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            {country && <span>📍 Store Location: {country}</span>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            {contact.phone && (
              <>
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:text-emerald-300">
                  Call Us: {contact.phone}
                </a>
                <span>•</span>
              </>
            )}
            <HeaderAuthLinks />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <MobileMenu items={navItems} categories={categories} />

          <Link href="/" aria-label={`${siteConfig.name} home`}>
            <BrandLogo />
          </Link>

          <form action="/shop" role="search" className="hidden flex-1 items-center gap-3 rounded-full border border-slate-200 bg-[#f7f8f6] px-3 py-2 md:flex">
            <select name="category" aria-label="Category" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none">
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
              className="flex-1 bg-transparent px-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button type="submit" aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-white">
              <Search size={16} />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ShopperSync />
            <HeaderShortcuts />
            <Link href="/account" aria-label="My account" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
              <CircleUserRound size={18} />
            </Link>
          </div>
        </div>
      </div>

      <nav aria-label="Main" className="border-t border-[#edf0ec] bg-[#f6f8f4]">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 overflow-x-auto px-4 py-4 text-sm font-medium text-slate-700 sm:justify-between lg:px-8">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="whitespace-nowrap transition hover:text-emerald-700">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
