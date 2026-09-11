import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { POLICY_SLUGS, countPlaceholders, policies } from "@/lib/policies";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-images";
import { missingBusinessDetails } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";

export type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  link?: { href: string; label: string };
  /** Set on the sample-catalog item, which offers a one-click removal. */
  sampleCount?: number;
};

/** What still stands between the store and launch, for the admin dashboard. */
export async function getLaunchChecklist(): Promise<ChecklistItem[]> {
  await requirePermission("settings.manage", "/admin");
  const supabase = await createClient();

  const [samples, placeholderImages] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_sample", true),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_sample", false)
      .eq("image", PRODUCT_PLACEHOLDER_IMAGE),
  ]);

  const items: ChecklistItem[] = [];

  const missing = missingBusinessDetails();
  if (missing.length > 0) {
    items.push({
      id: "business",
      title: "Add your business details",
      detail: `Still missing: ${missing.join(", ")}. Update lib/site-config.ts — missing details stay hidden on the site until then.`,
    });
  }

  if (samples.count) {
    items.push({
      id: "samples",
      title: `Replace the sample catalog (${samples.count} sample ${samples.count === 1 ? "product" : "products"})`,
      detail: "Sample products are labelled “Sample” in the store and aren't real. Add your own products, then remove the samples.",
      sampleCount: samples.count,
    });
  }

  if (placeholderImages.count) {
    items.push({
      id: "images",
      title: `${placeholderImages.count} ${placeholderImages.count === 1 ? "product uses" : "products use"} the placeholder image`,
      detail: "Edit each product and add a real photo.",
      link: { href: "/admin/products", label: "Go to products" },
    });
  }

  const draftPolicies = POLICY_SLUGS.filter((slug) => countPlaceholders(policies[slug]) > 0);
  if (draftPolicies.length > 0) {
    items.push({
      id: "policies",
      title: "Complete your policies",
      detail: `${draftPolicies.map((slug) => policies[slug].title).join(", ")} still contain highlighted placeholders. Edit lib/policies.ts.`,
      link: { href: `/policies/${draftPolicies[0]}`, label: "Review policies" },
    });
  }

  items.push({
    id: "payments",
    title: "Connect a payment gateway",
    detail: "Orders are created with payment pending until online payments are added.",
  });

  return items;
}
