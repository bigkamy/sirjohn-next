"use client";

import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";

type Sort = "newest" | "price-asc" | "price-desc" | "rating";

type Filters = {
  q: string;
  categories: string[];
  brands: string[];
  maxPrice: number | null;
  minRating: number;
  sort: Sort;
};

const NO_FILTERS: Filters = { q: "", categories: [], brands: [], maxPrice: null, minRating: 0, sort: "newest" };

/** Five rows of the three-column desktop grid; narrower layouts show the same 15 in fewer columns. */
const PRODUCTS_PER_PAGE = 15;

const RATING_FILTERS = [
  { stars: "★★★★★", min: 5 },
  { stars: "★★★★☆", min: 4 },
  { stars: "★★★☆☆", min: 3 },
];

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

type ShopCatalogProps = { products: Product[]; categories: string[]; initial?: Partial<Filters> };

/** Search, filters, and sorting for the (small) catalog, applied in the browser. */
export function ShopCatalog({ products, categories, initial }: ShopCatalogProps) {
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, ...initial });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const results = useRef<HTMLDivElement>(null);

  // Any change to the filters or the sort order sends the customer back to the first page:
  // staying on page 3 of a list that just became one page long shows an empty grid.
  const update = (patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const reset = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
  // Rating filters and sorting only make sense once products have real reviews.
  const hasReviews = useMemo(() => products.some((product) => product.reviews > 0), [products]);
  const priceCeiling = useMemo(
    () => Math.max(1000, Math.ceil(Math.max(0, ...products.map((product) => product.price)) / 1000) * 1000),
    [products],
  );

  const visible = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    const matches = products.filter(
      (product) =>
        (!query ||
          [product.name, product.brand, product.category, product.shortDescription].some((text) =>
            text.toLowerCase().includes(query),
          )) &&
        (filters.categories.length === 0 || filters.categories.includes(product.category)) &&
        (filters.brands.length === 0 || filters.brands.includes(product.brand)) &&
        (filters.maxPrice === null || product.price <= filters.maxPrice) &&
        (filters.minRating === 0 || (product.reviews > 0 && product.rating >= filters.minRating)),
    );

    if (filters.sort === "price-asc") matches.sort((a, b) => a.price - b.price);
    if (filters.sort === "price-desc") matches.sort((a, b) => b.price - a.price);
    if (filters.sort === "rating") matches.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    return matches;
  }, [products, filters]);

  // Clamped rather than reset, so a filter that shrinks the list can't leave us past the end.
  const totalPages = Math.max(1, Math.ceil(visible.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = visible.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    // The new page starts at the top of the grid, not wherever the pager was clicked.
    results.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtering =
    filters.q !== "" ||
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.maxPrice !== null ||
    filters.minRating > 0;

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Home / Shop</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Shop Golf Equipment</h1>
          {filters.q && (
            <p className="mt-2 text-sm text-slate-600">
              Results for “{filters.q}”{" "}
              <button type="button" onClick={() => update({ q: "" })} className="font-semibold text-emerald-700">
                Clear search
              </button>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span aria-live="polite">
            {visible.length === 0
              ? "No products to show"
              : `Showing ${pageStart + 1}–${pageStart + pageItems.length} of ${visible.length}${
                  filtering ? ` matching` : ""
                } products`}
          </span>
          <button
            type="button"
            aria-expanded={showFilters}
            aria-controls="shop-filters"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside id="shop-filters" className={`${showFilters ? "block" : "hidden"} space-y-6 self-start rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:block`}>
          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Category</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => update({ categories: toggle(filters.categories, category) })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Price Range</h2>
            <div className="space-y-3">
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={500}
                value={filters.maxPrice ?? priceCeiling}
                aria-label="Maximum price"
                onChange={(event) => {
                  const value = Number(event.target.value);
                  update({ maxPrice: value >= priceCeiling ? null : value });
                }}
                className="w-full accent-emerald-600"
              />
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>₹0</span>
                <span>Up to {formatPrice(filters.maxPrice ?? priceCeiling)}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Brands</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => update({ brands: toggle(filters.brands, brand) })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {hasReviews && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Ratings</h2>
            <div className="space-y-2 text-sm text-slate-600">
              {RATING_FILTERS.map(({ stars, min }) => (
                <button
                  key={min}
                  type="button"
                  aria-pressed={filters.minRating === min}
                  onClick={() => update({ minRating: filters.minRating === min ? 0 : min })}
                  className={`block w-full rounded-xl border px-3 py-2 text-left hover:border-emerald-300 hover:text-emerald-700 ${
                    filters.minRating === min ? "border-emerald-500 text-emerald-700" : "border-slate-200"
                  }`}
                >
                  {stars} & Up
                </button>
              ))}
            </div>
          </div>
          )}

          {filtering && (
            <button type="button" onClick={() => reset({ ...NO_FILTERS, sort: filters.sort })} className="text-sm font-semibold text-emerald-700">
              Clear all filters
            </button>
          )}
        </aside>

        {/* scroll-mt clears the sticky header when the pager scrolls this into view. */}
        <div ref={results} className="scroll-mt-32">
          <div className="mb-6 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="shop-sort" className="text-sm text-slate-600">Sort by</label>
            <select
              id="shop-sort"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as Sort })}
              className="rounded-full border border-slate-200 bg-[#f7f9f7] px-4 py-2 text-sm text-slate-700 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              {hasReviews && <option value="rating">Top Rated</option>}
            </select>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
              <p>{products.length === 0 ? "New products are on their way." : "No products match your filters."}</p>
              {filtering && (
                <button type="button" onClick={() => reset(NO_FILTERS)} className="mt-4 font-semibold text-emerald-700">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => goToPage(number)}
                      aria-label={`Page ${number}`}
                      aria-current={number === currentPage ? "page" : undefined}
                      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition ${
                        number === currentPage
                          ? "border-[#0f172a] bg-[#0f172a] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                    >
                      {number}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** Starts from the filters in the URL (?q=, ?category=, ?brand=), as linked from the header. */
export function ShopCatalogFromUrl(props: Omit<ShopCatalogProps, "initial">) {
  const params = useSearchParams();
  const initial = {
    q: params.get("q") ?? "",
    categories: params.getAll("category").filter(Boolean),
    brands: params.getAll("brand").filter(Boolean),
  };
  // Remount when the URL changes, e.g. a new search from the header.
  return <ShopCatalog key={params.toString()} {...props} initial={initial} />;
}
