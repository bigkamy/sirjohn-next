import { AccountHeading } from "@/components/account/account-heading";
import { AccountLayout } from "@/components/account/account-layout";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Profile Settings" };

export default async function Page() {
  const user = await requireUser("/account/profile");

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <AccountHeading eyebrow="Your details" title="Profile Settings" />
        <ProfileForm
          email={user.email}
          profile={{ firstName: user.profile.firstName, lastName: user.profile.lastName, phone: user.profile.phone ?? "" }}
        />
      </div>
    </AccountLayout>
  );
}
