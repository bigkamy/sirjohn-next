import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/product/product-detail-page";
import { isPlaceholderImage } from "@/lib/product-images";
import { getProductBySlug, getProducts } from "@/lib/products";
import { getFreeShippingThreshold } from "@/lib/shipping";

// Re-fetch catalog prices and stock every minute; checkout always re-prices from the database.
export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found", robots: { index: false } };
  }

  const description = product.shortDescription || product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/product/${product.slug}`,
      // The SVG placeholder isn't a usable share image.
      images: isPlaceholderImage(product.image) ? undefined : [{ url: product.image, alt: product.name }],
    },
    robots: product.isSample ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [catalog, freeShippingOver] = await Promise.all([getProducts(), getFreeShippingThreshold()]);
  // Same category first, then the rest of the catalog.
  const related = catalog
    .filter((item) => item.slug !== product.slug)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 4);

  return <ProductDetailPage product={product} related={related} freeShippingOver={freeShippingOver} />;
}
