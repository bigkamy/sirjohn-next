import Link from "next/link";
import { AccountHeading } from "@/components/account/account-heading";
import { AccountLayout } from "@/components/account/account-layout";
import { AddressActions } from "@/components/account/address-actions";
import { FormAlert } from "@/components/auth/form-controls";
import { listAddresses } from "@/lib/addresses";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "My Addresses" };

export default async function Page({ searchParams }: PageProps<"/account/addresses">) {
  const user = await requireUser("/account/addresses");
  const [addresses, { saved }] = await Promise.all([listAddresses(), searchParams]);

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        {saved && <FormAlert message="Address saved." />}

        <AccountHeading eyebrow="Delivery" title="My Addresses">
          <Link href="/account/addresses/new" className="self-start rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white sm:self-auto">
            Add New Address
          </Link>
        </AccountHeading>

        {addresses.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            You haven’t saved any addresses yet. Saved addresses can be picked in one tap at checkout.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{address.label}</h2>
                  {address.isDefault && (
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Default</span>
                  )}
                </div>
                <div className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                  <p className="font-medium text-slate-900">{address.fullName}</p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                  <p className="mt-1">{address.phone}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/account/addresses/${address.id}`}
                    aria-label={`Edit ${address.label} address`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
                  >
                    Edit
                  </Link>
                  <AddressActions id={address.id} label={address.label} isDefault={address.isDefault} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
