import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string | null;
    role: "customer" | "admin";
  };
};

/** The signed-in user, verified with Supabase Auth rather than trusted from the cookie. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Always per-request, even when Supabase is unconfigured and no cookies are read.
  await connection();

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,phone,role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    profile: {
      firstName: profile?.first_name ?? "",
      lastName: profile?.last_name ?? "",
      phone: profile?.phone ?? null,
      role: profile?.role === "admin" ? "admin" : "customer",
    },
  };
});

export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requireAdmin(nextPath: string) {
  const user = await requireUser(nextPath);
  if (user.profile.role !== "admin") {
    redirect("/account");
  }
  return user;
}
