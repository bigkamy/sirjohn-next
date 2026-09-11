import Link from "next/link";
import { Fragment } from "react";
import { formatPrice } from "@/lib/format";
import { POLICY_SLUGS, countPlaceholders, policies, type Policy } from "@/lib/policies";
import type { ShippingRate } from "@/lib/shipping";

/** Renders policy text, highlighting any {{placeholder}} the business still has to fill in. */
function PolicyText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\{.+?\}\})/).map((part, index) =>
        part.startsWith("{{") ? (
          <mark key={index} className="rounded bg-amber-100 px-1 font-medium text-amber-900">
            [To be completed: {part.slice(2, -2)}]
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function ShippingRatesTable({ rates }: { rates: ShippingRate[] }) {
  if (rates.length === 0) {
    return <p>Delivery options are shown at checkout.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#f7f9f7] text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Delivery option</th>
            <th className="px-4 py-3 font-semibold">Charge</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate.name} className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium text-slate-900">{rate.name}</td>
              <td className="px-4 py-3">
                {rate.price === 0 ? "Free" : formatPrice(rate.price)}
                {rate.price > 0 && rate.freeOver !== null && ` (free on orders of ${formatPrice(rate.freeOver)} or more)`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PolicyPage({ policy, shippingRates = [] }: { policy: Policy; shippingRates?: ShippingRate[] }) {
  const isDraft = countPlaceholders(policy) > 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Policies</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{policy.title}</h1>
        <p className="mt-3 text-base text-slate-600">{policy.summary}</p>
        <p className="mt-4 text-sm text-slate-500">
          Last updated: <PolicyText text={policy.lastUpdated ?? "{{Date this policy takes effect}}"} />
        </p>
      </div>

      {isDraft && (
        <div role="note" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This policy is being finalised. Highlighted items will be completed before it takes effect.
        </div>
      )}

      <article className="mt-6 space-y-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-base leading-7 text-slate-600">
              {section.content.map((block, index) =>
                Array.isArray(block) ? (
                  <ul key={index} className="list-disc space-y-2 pl-5">
                    {block.map((item) => (
                      <li key={item}>
                        <PolicyText text={item} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={index}>
                    <PolicyText text={block} />
                  </p>
                ),
              )}
              {section.showShippingRates && <ShippingRatesTable rates={shippingRates} />}
            </div>
          </section>
        ))}
      </article>

      <nav aria-label="Policies" className="mt-6 flex flex-wrap gap-3 text-sm">
        {POLICY_SLUGS.filter((slug) => slug !== policy.slug).map((slug) => (
          <Link key={slug} href={`/policies/${slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
            {policies[slug].title}
          </Link>
        ))}
      </nav>
    </main>
  );
}
