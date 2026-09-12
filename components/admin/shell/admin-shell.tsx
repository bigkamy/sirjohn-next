"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  ExternalLink,
  FolderTree,
  GalleryHorizontal,
  HeartPulse,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Tag,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/admin/ui/toast";
import { ADMIN_SIDEBAR_COOKIE, type AdminNavIcon, type AdminNavSection } from "@/lib/admin/nav";
import { logout } from "@/lib/auth/actions";
import { siteConfig } from "@/lib/site-config";

const ICONS: Record<AdminNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  products: Package,
  categories: FolderTree,
  inventory: Boxes,
  media: ImageIcon,
  reviews: MessageSquareText,
  homepage: GalleryHorizontal,
  orders: ReceiptText,
  payments: CreditCard,
  coupons: Tag,
  customers: Users,
  staff: UserCog,
  settings: Settings,
  security: ShieldCheck,
  health: HeartPulse,
};

type ShellUser = { name: string; email: string; roleLabel: string; initials: string };

type AdminShellProps = {
  nav: AdminNavSection[];
  user: ShellUser;
  defaultCollapsed: boolean;
  children: ReactNode;
};

export function AdminShell({ nav, user, defaultCollapsed, children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  const current = nav.flatMap((section) => section.items).find((item) => isActive(item.href));

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    // Read by the admin layout on the next request, so the sidebar renders in the right state.
    document.cookie = `${ADMIN_SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/admin; max-age=31536000; samesite=lax`;
  };

  return (
    <ToastProvider>
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold">
        Skip to content
      </a>
      <div className="min-h-screen bg-[#f4f6f5] text-slate-900">
        <aside
          aria-label="Admin navigation"
          className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-[#0b1220] text-slate-300 transition-[width] duration-200 lg:flex ${collapsed ? "w-[76px]" : "w-64"}`}
        >
          <SidebarContent nav={nav} collapsed={collapsed} isActive={isActive} onToggle={toggleCollapsed} />
        </aside>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            onKeyDown={(event) => {
              if (event.key === "Escape") setDrawerOpen(false);
            }}
          >
            <button type="button" aria-label="Close menu" tabIndex={-1} className="absolute inset-0 bg-slate-950/60" onClick={() => setDrawerOpen(false)} />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#0b1220] text-slate-300 shadow-2xl">
              <button
                type="button"
                autoFocus
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
              <SidebarContent nav={nav} collapsed={false} isActive={isActive} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{current?.label ?? "Admin"}</p>
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              prefetch={false}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              View store <ExternalLink size={14} aria-hidden />
            </Link>
            <UserMenu user={user} />
          </header>

          <main id="admin-main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

function SidebarContent({
  nav,
  collapsed,
  isActive,
  onNavigate,
  onToggle,
}: {
  nav: AdminNavSection[];
  collapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  onToggle?: () => void;
}) {
  return (
    <>
      <div className={`flex h-16 shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3" aria-label={`${siteConfig.name} admin`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-sm font-black text-[#0b1220]">
            {siteConfig.brand.monogram}
          </span>
          {!collapsed && (
            <span className="leading-tight">
              <span className="block text-sm font-black tracking-[0.2em] text-white">{siteConfig.brand.wordmark}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-300">Admin</span>
            </span>
          )}
        </Link>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((section) => (
          <div key={section.title} className="mb-5">
            {collapsed ? (
              <div className="mx-2 mb-2 border-t border-white/10" aria-hidden />
            ) : (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{section.title}</p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? "justify-center" : ""} ${
                        active ? "bg-emerald-400/15 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon size={18} aria-hidden className={active ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-200"} />
                      {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {onToggle && (
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? <ChevronsRight size={18} aria-hidden /> : <><ChevronsLeft size={18} aria-hidden /> Collapse</>}
          </button>
        </div>
      )}
    </>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white" aria-hidden>
          {user.initials}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[160px] truncate text-sm font-semibold text-slate-900">{user.name}</span>
          <span className="block text-xs text-slate-500">{user.roleLabel}</span>
        </span>
        <span className="sr-only">Account menu</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        <div className="border-b border-slate-100 px-3 pb-3 pt-2">
          <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <p className="mt-1 text-xs font-medium text-emerald-700">{user.roleLabel}</p>
        </div>
        <Link href="/account" className="mt-1 flex rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">My account</Link>
        <Link href="/" className="flex rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">View store</Link>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
            <LogOut size={15} aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
