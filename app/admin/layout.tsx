import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { ADMIN_SIDEBAR_COOKIE, adminNavFor } from "@/lib/admin/nav";
import { requireStaff } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: { default: "Admin", template: `%s · Admin | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

// The shell for staff only. Layouts don't re-run on every navigation, so each page and
// action also checks its own permission (requirePermission) — this is not the only gate.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff("/admin");
  const cookieStore = await cookies();

  const { firstName, lastName } = staff.user.profile;
  const name = `${firstName} ${lastName}`.trim() || staff.user.email;
  const initials = (`${firstName.charAt(0)}${lastName.charAt(0)}` || staff.user.email.charAt(0) || "?").toUpperCase();

  return (
    <AdminShell
      nav={adminNavFor(staff.permissions)}
      user={{ name, email: staff.user.email, roleLabel: ROLE_LABELS[staff.role], initials }}
      defaultCollapsed={cookieStore.get(ADMIN_SIDEBAR_COOKIE)?.value === "collapsed"}
    >
      {children}
    </AdminShell>
  );
}
