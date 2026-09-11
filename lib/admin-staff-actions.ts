"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { logAdminError } from "@/lib/admin/log";
import { requirePermission } from "@/lib/auth/dal";
import { ROLE_LABELS, toUserRole, type UserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

export type FoundUser = { id: string; email: string; name: string; role: UserRole };

const ROLE_ERRORS: Record<string, string> = {
  own_role: "You can't change your own role.",
  role_not_allowed: "Your role can't give or remove that level of access.",
  user_not_found: "This account no longer exists.",
  not_authorized: "Your role can't manage team members.",
};

/** Finds a registered account by its exact email address. */
export async function findUserByEmail(email: string): Promise<{ ok: true; user: FoundUser } | { ok: false; message: string }> {
  await requirePermission("staff.manage", "/admin/staff");
  const parsed = z.email().safeParse(typeof email === "string" ? email.trim() : "");
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_find_user", { p_email: parsed.data });
  if (error) {
    await logAdminError("staff.find", "user", null, error.message);
    return { ok: false, message: "We couldn't search for that account. Please try again." };
  }

  const row = (data as { id: string; email: string; first_name: string; last_name: string; role: string }[])[0];
  if (!row) {
    return { ok: false, message: "No account uses this email. Ask them to register on the store first, then search again." };
  }
  return {
    ok: true,
    user: { id: row.id, email: row.email, name: `${row.first_name} ${row.last_name}`.trim() || row.email, role: toUserRole(row.role) },
  };
}

/** Gives someone a role, or removes admin access (role "customer"). The database decides who may do what. */
export async function setUserRole(userId: string, role: string): Promise<{ ok: boolean; message: string }> {
  await requirePermission("staff.manage", "/admin/staff");
  if (!isUuid(userId) || !(role in ROLE_LABELS)) {
    return { ok: false, message: "Choose a valid role." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
  if (error) {
    const message = ROLE_ERRORS[error.message];
    if (!message) await logAdminError("staff.role", "user", userId, error.message);
    return { ok: false, message: message ?? "We couldn't change this role. Please try again." };
  }

  revalidatePath("/admin/staff");
  revalidatePath(`/admin/staff/${userId}`);
  revalidatePath("/admin/security");
  return {
    ok: true,
    message: role === "customer" ? "Admin access removed." : `Role changed to ${ROLE_LABELS[role as UserRole].toLowerCase()}.`,
  };
}
