import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/auth/form-controls";
import { RegisterForm } from "@/components/auth/register-form";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { siteImages } from "@/lib/site-images";
import { isSupabaseConfigured, notConfiguredMessage } from "@/lib/supabase/env";

export const metadata = {
  title: "Create Account",
  robots: { index: false },
};

export default async function Page({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const nextPath = safeRedirectPath(next);
  const loginHref = typeof next === "string" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create Account"
      image={siteImages.register}
    >
      {!isSupabaseConfigured() && (
        <div className="mt-6">
          <FormAlert error={notConfiguredMessage} />
        </div>
      )}

      <RegisterForm next={nextPath} />

      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        By creating an account you agree to our{" "}
        <Link href="/policies/terms" className="font-semibold text-brand-700">Terms &amp; Conditions</Link> and{" "}
        <Link href="/policies/privacy" className="font-semibold text-brand-700">Privacy Policy</Link>.
      </p>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account? <Link href={loginHref} className="font-semibold text-brand-700">Login</Link>
      </p>
    </AuthShell>
  );
}
