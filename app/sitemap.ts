import type { MetadataRoute } from "next";
import { POLICY_SLUGS, countPlaceholders, policies } from "@/lib/policies";
import { getProducts } from "@/lib/products";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    // Draft policies and sample products are kept out until they're real.
    ...POLICY_SLUGS.filter((slug) => countPlaceholders(policies[slug]) === 0).map((slug) => ({
      url: `${siteUrl}/policies/${slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...products
      .filter((product) => !product.isSample)
      .map((product) => ({
        url: `${siteUrl}/product/${product.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
