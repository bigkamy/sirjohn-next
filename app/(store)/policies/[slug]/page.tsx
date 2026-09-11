import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/policies/policy-page";
import { POLICY_SLUGS, countPlaceholders, getPolicy } from "@/lib/policies";
import { getActiveShippingRates } from "@/lib/shipping";

// Unknown slugs 404 through notFound() below. `dynamicParams = false` is avoided on purpose:
// once an admin save revalidates the layout, Next can't regenerate these pages under it and
// serves a 404 instead.
export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const policy = getPolicy((await params).slug);
  if (!policy) {
    return {};
  }
  return {
    title: policy.title,
    description: policy.summary,
    alternates: { canonical: `/policies/${policy.slug}` },
    // Drafts with placeholders stay out of search results until they're finished.
    robots: countPlaceholders(policy) > 0 ? { index: false } : undefined,
  };
}

export default async function Page({ params }: PageProps<"/policies/[slug]">) {
  const policy = getPolicy((await params).slug);
  if (!policy) {
    notFound();
  }

  const shippingRates = policy.slug === "shipping" ? await getActiveShippingRates() : [];
  return <PolicyPage policy={policy} shippingRates={shippingRates} />;
}
