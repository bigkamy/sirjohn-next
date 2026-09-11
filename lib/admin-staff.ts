import "server-only";
import { requireStaff } from "@/lib/auth/dal";
import { STAFF_ROLES, toUserRole, type Permission, type StaffRole, type UserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  createdAt: string;
  lastSignInAt: string | null;
};

export type RoleMatrix = Record<UserRole, { permissions: Permission[]; assignable: UserRole[] }>;

type StaffRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
};

/** Everyone with admin access. The database allows this for staff and security managers only. */
export async function listStaff(): Promise<StaffMember[]> {
  await requireStaff("/admin/staff");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_staff");
  if (error) {
    throw new Error(`Failed to load staff: ${error.message}`);
  }

  return (data as StaffRow[])
    .map((row) => ({
      id: row.id,
      email: row.email,
      name: `${row.first_name} ${row.last_name}`.trim() || row.email,
      role: toUserRole(row.role) as StaffRole,
      createdAt: row.created_at,
      lastSignInAt: row.last_sign_in_at,
    }))
    .filter((member) => (STAFF_ROLES as readonly string[]).includes(member.role));
}

/** Each role's permissions and whom it may manage, straight from the database. */
export async function getRoleMatrix(): Promise<RoleMatrix> {
  await requireStaff("/admin/security");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_role_matrix");
  if (error) {
    throw new Error(`Failed to load roles: ${error.message}`);
  }
  return data as RoleMatrix;
}
