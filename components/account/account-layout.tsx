import Link from "next/link";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Settings, ShieldCheck, User } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/dal";
import { isStaffRole } from "@/lib/auth/roles";

const links = [
  { label: "Dashboard", href: "/account", icon: User },
  { label: "My Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "My Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Profile Settings", href: "/account/profile", icon: Settings },
  { label: "Change Password", href: "/account/reset-password", icon: ShieldCheck },
];

const navItemClass =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-[#f7f9f7] hover:text-emerald-700";

export function AccountLayout({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const { firstName, lastName, role } = user.profile;
  const name = `${firstName} ${lastName}`.trim() || user.email;
  const initials = (firstName.charAt(0) + lastName.charAt(0) || user.email.charAt(0)).toUpperCase();
  const navLinks = isStaffRole(role) ? [...links, { label: "Admin Panel", href: "/admin", icon: LayoutDashboard }] : links;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#f7f9f7] p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-sm font-bold text-white">{initials}</div>
            <div className="min-w-0">
              <div className="truncate font-bold text-slate-900">{name}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
          </div>

          <nav className="space-y-2">
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href} className={navItemClass}>
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <form action={logout}>
              <button type="submit" className={navItemClass}>
                <LogOut size={16} />
                Logout
              </button>
            </form>
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </main>
  );
}
