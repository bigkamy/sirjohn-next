import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Reset Password",
  robots: { index: false },
};

export default function Page() {
  return (
    <AuthShell eyebrow="Account help" title="Reset Password">
      <p className="mt-4 text-sm text-slate-600">
        Enter the email you registered with and we’ll send you a link to choose a new password.
      </p>

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it? <Link href="/login" className="font-semibold text-emerald-700">Back to login</Link>
      </p>
    </AuthShell>
  );
}
