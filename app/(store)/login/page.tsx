import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/auth/form-controls";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { siteImages } from "@/lib/site-images";
import { isSupabaseConfigured, notConfiguredMessage } from "@/lib/supabase/env";

export const metadata = {
  title: "Login",
  robots: { index: false },
};

export default async function Page({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = safeRedirectPath(next);
  // Keep the destination (e.g. /checkout) if the shopper switches to registering.
  const registerHref = typeof next === "string" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  const notice = !isSupabaseConfigured()
    ? notConfiguredMessage
    : error === "invalid_link"
      ? "That link is invalid or has expired. Please request a new one."
      : undefined;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Login"
      image={siteImages.login}
    >
      {notice && (
        <div className="mt-6">
          <FormAlert error={notice} />
        </div>
      )}

      <LoginForm next={nextPath} />

      <p className="mt-6 text-center text-sm text-slate-600">
        Don’t have an account? <Link href={registerHref} className="font-semibold text-brand-700">Register</Link>
      </p>
    </AuthShell>
  );
}
