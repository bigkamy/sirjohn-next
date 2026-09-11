import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { mergeGuestCart } from "@/lib/cart";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Landing route for links in Supabase auth emails (sign-up confirmation, password reset).
// Accepts both the PKCE `code` from the default templates and the `token_hash` from custom ones.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let verified = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();

    if (code) {
      verified = !(await supabase.auth.exchangeCodeForSession(code)).error;
    } else if (tokenHash && type) {
      verified = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
    }

    if (verified) {
      await mergeGuestCart(supabase);
    }
  }

  redirect(verified ? safeRedirectPath(searchParams.get("next")) : "/login?error=invalid_link");
}
