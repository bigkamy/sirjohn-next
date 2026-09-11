import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { RoleBadge } from "@/components/admin/ui/badge";
import { Card, CardHeader, PageHeader, TextLink } from "@/components/admin/ui/primitives";
import { Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import { listActivity } from "@/lib/admin-activity";
import { getRoleMatrix, listStaff } from "@/lib/admin-staff";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSION_LABELS, PERMISSIONS, ROLE_LABELS, STAFF_ROLES } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Security" };

export default async function Page() {
  const staff = await requirePermission("security.view", "/admin/security");
  const [matrix, members, roleChanges] = await Promise.all([getRoleMatrix(), listStaff(), listActivity({ actionPrefix: "staff.", limit: 15 })]);
  const canManageStaff = staff.permissions.has("staff.manage");

  return (
    <>
      <PageHeader
        title="Security"
        description="Who can do what in the admin panel. These permissions are enforced by the database on every request, not just by hiding menu items."
        actions={<TextLink href="/admin/system-health">System health</TextLink>}
      />

      <Card>
        <CardHeader title="Roles and permissions" />
        <Table label="Roles and permissions">
          <THead>
            <Th>Permission</Th>
            {STAFF_ROLES.map((role) => (
              <Th key={role} className="text-center">{ROLE_LABELS[role]}</Th>
            ))}
          </THead>
          <TBody>
            {PERMISSIONS.map((permission) => (
              <tr key={permission}>
                <Td>{PERMISSION_LABELS[permission]}</Td>
                {STAFF_ROLES.map((role) => {
                  const allowed = matrix[role]?.permissions.includes(permission);
                  return (
                    <Td key={role} className="text-center">
                      {allowed ? <Check size={16} className="mx-auto text-emerald-600" aria-label="Allowed" /> : <Minus size={16} className="mx-auto text-slate-300" aria-label="Not allowed" />}
                    </Td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <Td>Can give or remove these roles</Td>
              {STAFF_ROLES.map((role) => {
                const roles = (matrix[role]?.assignable ?? []).filter((assignable) => assignable !== "customer");
                return (
                  <Td key={role} className="text-center text-xs text-slate-600">
                    {roles.length === 0 ? "—" : roles.map((assignable) => ROLE_LABELS[assignable]).join(", ")}
                  </Td>
                );
              })}
            </tr>
          </TBody>
        </Table>
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Nobody can change their own role. Customers have no admin access at all.</p>
      </Card>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="People with admin access" action={canManageStaff ? <TextLink href="/admin/staff">Manage staff</TextLink> : undefined} />
          <ul className="divide-y divide-slate-100">
            {members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  {canManageStaff ? (
                    <Link href={`/admin/staff/${member.id}`} className="font-medium text-slate-900 hover:text-emerald-700">{member.name}</Link>
                  ) : (
                    <p className="font-medium text-slate-900">{member.name}</p>
                  )}
                  <p className="truncate text-xs text-slate-500">
                    {member.email} · last signed in {member.lastSignInAt ? formatDateTime(member.lastSignInAt) : "never"}
                  </p>
                </div>
                <RoleBadge role={member.role} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Recent role changes" />
          <ActivityFeed entries={roleChanges} empty="No role changes recorded yet." />
        </Card>
      </div>
    </>
  );
}
