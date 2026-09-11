import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isStaffRole, toUserRole, type Permission, type StaffRole, type UserRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string | null;
    role: UserRole;
  };
};

export type StaffContext = {
  user: SessionUser;
  role: StaffRole;
  permissions: ReadonlySet<Permission>;
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
      role: toUserRole(profile?.role),
    },
  };
});

/**
 * The signed-in staff member and what they may do, or null for customers and visitors.
 * Permissions come from the database (my_permissions), the same list its policies enforce.
 */
export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.profile.role)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_permissions");
  if (error) {
    throw new Error(`Failed to load permissions: ${error.message}`);
  }

  return { user, role: user.profile.role, permissions: new Set((data ?? []) as Permission[]) };
});

export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** Every admin page and action starts here: visitors go to login, customers leave the admin area. */
export async function requireStaff(nextPath: string): Promise<StaffContext> {
  await requireUser(nextPath);
  const staff = await getStaffContext();
  if (!staff) {
    redirect("/account?notice=staff-only");
  }
  return staff;
}

/** Staff without this permission go back to the dashboard, which explains why. */
export async function requirePermission(permission: Permission, nextPath: string): Promise<StaffContext> {
  const staff = await requireStaff(nextPath);
  if (!staff.permissions.has(permission)) {
    redirect(`/admin?denied=${encodeURIComponent(permission)}`);
  }
  return staff;
}
