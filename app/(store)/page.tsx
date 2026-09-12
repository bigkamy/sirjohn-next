import { HomePage } from "@/components/home/home-page";
import { getActiveHeroSlides } from "@/lib/home-hero";
import { getCategoryList, getProducts } from "@/lib/products";
import { getFreeShippingThreshold } from "@/lib/shipping";

// Re-fetch catalog prices and stock every minute; checkout always re-prices from the database.
export const revalidate = 60;

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Page() {
  const [products, categories, freeShippingOver, heroSlides] = await Promise.all([
    getProducts(),
    getCategoryList(),
    getFreeShippingThreshold(),
    getActiveHeroSlides(),
  ]);
  return <HomePage products={products} categories={categories} freeShippingOver={freeShippingOver} heroSlides={heroSlides} />;
}
