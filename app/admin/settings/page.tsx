import Link from "next/link";
import { ShippingMethodForm } from "@/components/admin/shipping-method-form";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardHeader, DetailList, Notice, PageHeader } from "@/components/admin/ui/primitives";
import { requirePermission } from "@/lib/auth/dal";
import { countPlaceholders, POLICY_SLUGS, policies } from "@/lib/policies";
import { listShippingMethodsForAdmin } from "@/lib/shipping";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "Settings" };

const notSet = <span className="text-slate-400">Not set</span>;

export default async function Page() {
  await requirePermission("settings.manage", "/admin/settings");
  const methods = await listShippingMethodsForAdmin();
  const { contact } = siteConfig;

  return (
    <>
      <PageHeader title="Settings" description="Shipping charges are edited here. Business details and policies live in the code, so changes to them go through a deploy." />

      <section id="shipping" aria-labelledby="shipping-heading" className="scroll-mt-24">
        <h2 id="shipping-heading" className="mb-1 text-lg font-semibold text-slate-900">Shipping methods</h2>
        <p className="mb-4 text-sm text-slate-500">
          Checkout charges exactly these amounts, and the storefront&apos;s free-shipping message follows the lowest “free when order reaches” value. Changes apply
          to new orders immediately.
        </p>
        <div className="grid gap-6 xl:grid-cols-2">
          {methods.map((method) => (
            <ShippingMethodForm key={method.code} method={method} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Business details" description={<>Edit <code>lib/site-config.ts</code>. Anything not set stays hidden on the store.</>} />
          <DetailList
            items={[
              { label: "Store name", value: siteConfig.name },
              { label: "Legal name", value: siteConfig.legalName ?? notSet },
              { label: "Address", value: contact.address ?? notSet },
              { label: "Phone", value: contact.phone ?? notSet },
              { label: "Email", value: contact.email ?? notSet },
              { label: "Hours", value: contact.hours ?? notSet },
              { label: "Social links", value: siteConfig.social.length > 0 ? siteConfig.social.map((link) => link.label).join(", ") : notSet },
            ]}
          />
        </Card>

        <Card>
          <CardHeader title="Policies" description={<>Edit <code>lib/policies.ts</code>. Drafts show a notice and stay out of search results.</>} />
          <ul className="divide-y divide-slate-100">
            {POLICY_SLUGS.map((slug) => {
              const policy = policies[slug];
              const remaining = countPlaceholders(policy);
              return (
                <li key={slug} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Link href={`/policies/${slug}`} target="_blank" prefetch={false} className="flex-1 text-sm font-medium text-slate-900 hover:text-emerald-700">
                    {policy.title}
                  </Link>
                  {remaining > 0 ? <Badge tone="warning">Draft · {remaining} to complete</Badge> : <Badge tone="success">Complete</Badge>}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Notice>
          Payments: no payment gateway is connected yet. Orders are created with payment pending; connecting a gateway is a separate step.
        </Notice>
      </div>
    </>
  );
}
