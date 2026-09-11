import Link from "next/link";
import { RemoveAccessButton, RoleSelect, AddStaffForm } from "@/components/admin/staff/staff-controls";
import { RoleBadge } from "@/components/admin/ui/badge";
import { Card, CardHeader, PageHeader } from "@/components/admin/ui/primitives";
import { Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import { getRoleMatrix, listStaff } from "@/lib/admin-staff";
import { requirePermission } from "@/lib/auth/dal";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata = { title: "Staff" };

export default async function Page() {
  const staff = await requirePermission("staff.manage", "/admin/staff");
  const [members, matrix] = await Promise.all([listStaff(), getRoleMatrix()]);
  const assignable = matrix[staff.role].assignable;

  return (
    <>
      <PageHeader
        title="Staff"
        description="Everyone who can open the admin panel. New team members register a normal account on the store first; then you give it a role here. Nobody can change their own role, and only super admins can create admins."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader title={`${members.length} team ${members.length === 1 ? "member" : "members"}`} />
          <Table label="Team members">
            <THead>
              <Th>Member</Th>
              <Th>Role</Th>
              <Th className="hidden md:table-cell">Last signed in</Th>
              <Th className="hidden lg:table-cell">Joined</Th>
              <Th>Change</Th>
              <Th className="text-right">Access</Th>
            </THead>
            <TBody>
              {members.map((member) => {
                const isSelf = member.id === staff.user.id;
                const manageable = !isSelf && assignable.includes(member.role);
                return (
                  <tr key={member.id}>
                    <Td>
                      <Link href={`/admin/staff/${member.id}`} className="block min-w-[180px]">
                        <span className="block font-medium text-slate-900 hover:text-emerald-700">{member.name}</span>
                        <span className="block truncate text-xs text-slate-500">{member.email}</span>
                      </Link>
                    </Td>
                    <Td><RoleBadge role={member.role} /></Td>
                    <Td className="hidden whitespace-nowrap md:table-cell">{member.lastSignInAt ? formatDateTime(member.lastSignInAt) : "Never"}</Td>
                    <Td className="hidden whitespace-nowrap lg:table-cell">{formatDate(member.createdAt)}</Td>
                    <Td><RoleSelect userId={member.id} name={member.name} role={member.role} assignable={assignable} isSelf={isSelf} /></Td>
                    <Td className="text-right">{manageable ? <RemoveAccessButton userId={member.id} name={member.name} /> : <span className="text-xs text-slate-400">—</span>}</Td>
                  </tr>
                );
              })}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Add a team member" description="Search for the email they registered with." />
          <AddStaffForm assignable={assignable} />
        </Card>
      </div>
    </>
  );
}
