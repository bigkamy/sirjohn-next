import { AccountHeading } from "@/components/account/account-heading";
import { AccountLayout } from "@/components/account/account-layout";
import { AddressForm } from "@/components/account/address-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Add Address" };

export default async function Page() {
  const user = await requireUser("/account/addresses/new");

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <AccountHeading eyebrow="Delivery" title="Add Address" />
        <AddressForm />
      </div>
    </AccountLayout>
  );
}
