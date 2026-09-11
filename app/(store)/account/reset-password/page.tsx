import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "Set a New Password" };

export default async function Page() {
  const user = await requireUser("/account/reset-password");

  return (
    <AuthShell eyebrow="Account security" title="Set a New Password">
      <p className="mt-4 text-sm text-slate-600">
        Choose a new password for <span className="font-semibold text-slate-900">{user.email}</span>.
      </p>

      <ResetPasswordForm />
    </AuthShell>
  );
}
