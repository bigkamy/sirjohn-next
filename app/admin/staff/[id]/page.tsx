import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { RemoveAccessButton, RoleSelect } from "@/components/admin/staff/staff-controls";
import { RoleBadge } from "@/components/admin/ui/badge";
import { Card, CardHeader, DetailList, Notice, PageHeader } from "@/components/admin/ui/primitives";
import { listActivity } from "@/lib/admin-activity";
import { getCustomer } from "@/lib/admin-customers";
import { getRoleMatrix } from "@/lib/admin-staff";
import { requirePermission } from "@/lib/auth/dal";
import { isStaffRole, PERMISSION_LABELS } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Team member" };

export default async function Page({ params }: PageProps<"/admin/staff/[id]">) {
  const { id } = await params;
  const staff = await requirePermission("staff.manage", `/admin/staff/${id}`);
  const [member, matrix] = await Promise.all([getCustomer(id), getRoleMatrix()]);
  if (!member) {
    notFound();
  }

  const activity = await listActivity({ actorId: member.id, limit: 30 });
  const assignable = matrix[staff.role].assignable;
  const isSelf = member.id === staff.user.id;
  const permissions = matrix[member.role].permissions;

  return (
    <>
      <PageHeader
        title={member.name}
        back={{ href: "/admin/staff", label: "Staff" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {member.email} <RoleBadge role={member.role} />
          </span>
        }
        actions={isStaffRole(member.role) && !isSelf && assignable.includes(member.role) ? <RemoveAccessButton userId={member.id} name={member.name} /> : undefined}
      />

      {!isStaffRole(member.role) && (
        <div className="mb-6">
          <Notice>This account has no admin access. Give it a role from the Staff page.</Notice>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account" />
            <DetailList
              items={[
                { label: "Role", value: <RoleSelect userId={member.id} name={member.name} role={member.role} assignable={assignable} isSelf={isSelf} /> },
                { label: "Email", value: member.email },
                { label: "Phone", value: member.phone ?? "—" },
                { label: "Account created", value: formatDateTime(member.createdAt) },
                { label: "Last signed in", value: member.lastSignInAt ? formatDateTime(member.lastSignInAt) : "Never" },
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="What this role can do" />
            {permissions.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">Nothing in the admin panel.</p>
            ) : (
              <ul className="space-y-1.5 px-5 py-4 text-sm text-slate-700">
                {permissions.map((permission) => (
                  <li key={permission}>{PERMISSION_LABELS[permission] ?? permission}</li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader title="Recent activity" description="Changes this person made in the admin panel." />
          <ActivityFeed entries={activity} empty="No admin activity recorded yet." />
        </Card>
      </div>
    </>
  );
}
