import { notFound } from "next/navigation";
import { AccountHeading } from "@/components/account/account-heading";
import { AccountLayout } from "@/components/account/account-layout";
import { AddressForm } from "@/components/account/address-form";
import { getAddress } from "@/lib/addresses";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Edit Address" };

export default async function Page({ params }: PageProps<"/account/addresses/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/addresses/${encodeURIComponent(id)}`);
  const address = await getAddress(id);
  if (!address) {
    notFound();
  }

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <AccountHeading eyebrow="Delivery" title="Edit Address" />
        <AddressForm address={address} />
      </div>
    </AccountLayout>
  );
}
