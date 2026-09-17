// Photography used by the storefront design, kept in one place so it's easy to replace.
// Use a full https:// URL, or a file you add to /public (e.g. "/images/hero-1.jpg").
// A banner set to null shows a plain branded panel; an empty story list hides that section.

const GOLF_COURSE = "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80";

export const siteImages = {
  /** One image per home page hero slide. */
  hero: [GOLF_COURSE, GOLF_COURSE, GOLF_COURSE],
  /**
   * One image per home page banner, each from the product photography for that category, so
   * the card shows what it links to. Null falls back to a plain branded panel.
   */
  banners: {
    clubs: "/images/Product/complete-club-set.png" as string | null,
    apparel: "/images/Product/compression-arm-sleeve.png" as string | null,
    bags: "/images/Product/tour-bag-headcover-collection.png" as string | null,
  },
  /** "Follow our story" gallery on the home page. */
  story: [] as string[],
  login: GOLF_COURSE,
  register: GOLF_COURSE,
  about: GOLF_COURSE,
};
