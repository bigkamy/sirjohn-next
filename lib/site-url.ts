/**
 * Public origin of the site, used for canonical URLs, Open Graph, the sitemap, and links in
 * auth emails. Set NEXT_PUBLIC_SITE_URL in production; localhost is only a development default.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
