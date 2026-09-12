"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type MobileMenuProps = {
  items: { label: string; href: string }[];
  categories: string[];
};

/** Menu button and panel for small screens, where the search bar is hidden. */
export function MobileMenu({ items, categories }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 lg:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full z-40 border-b border-slate-200 bg-white px-4 py-5 shadow-lg lg:hidden">
          {/* No onSubmit here: closing the panel unmounts this form mid-submit and the browser
              then cancels the navigation. The next page renders with the menu closed anyway. */}
          <form action="/shop" role="search" className="flex items-center gap-2 rounded-full border border-slate-200 bg-[#f7f8f6] px-3 py-2">
            <select name="category" aria-label="Category" className="rounded-full border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none">
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input
              type="search"
              name="q"
              aria-label="Search products"
              placeholder="Search golf products..."
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button type="submit" aria-label="Search" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-white">
              <Search size={15} />
            </button>
          </form>

          <nav aria-label="Mobile" className="mt-4 grid gap-1">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className="rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-[#f7f9f7] hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
