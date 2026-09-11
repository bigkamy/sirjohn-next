import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCategories } from "@/lib/products";
import { getFreeShippingThreshold } from "@/lib/shipping";

// The customer-facing site: store header and footer. The admin panel has its own layout.
export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [freeShippingOver, categories] = await Promise.all([getFreeShippingThreshold(), getCategories()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader categories={categories} />
      <div className="flex-1">{children}</div>
      <SiteFooter freeShippingOver={freeShippingOver} categories={categories} />
    </div>
  );
}
