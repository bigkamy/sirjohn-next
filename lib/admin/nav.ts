import type { Permission } from "@/lib/auth/roles";

/** Remembers whether the admin sidebar is collapsed, so it renders that way on the server. */
export const ADMIN_SIDEBAR_COOKIE = "sj_admin_sidebar";

export type AdminNavIcon =
  | "dashboard"
  | "analytics"
  | "products"
  | "categories"
  | "inventory"
  | "media"
  | "reviews"
  | "orders"
  | "payments"
  | "coupons"
  | "customers"
  | "staff"
  | "settings"
  | "security"
  | "health";

export type AdminNavItem = { label: string; href: string; icon: AdminNavIcon };
export type AdminNavSection = { title: string; items: AdminNavItem[] };

type NavEntry = AdminNavItem & { permission: Permission };

// Each section needs the same permission its page checks with requirePermission.
const ADMIN_NAV: { title: string; items: NavEntry[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: "dashboard", permission: "dashboard.view" },
      { label: "Analytics", href: "/admin/analytics", icon: "analytics", permission: "analytics.view" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: "products", permission: "catalog.view" },
      { label: "Categories", href: "/admin/categories", icon: "categories", permission: "catalog.view" },
      { label: "Inventory", href: "/admin/inventory", icon: "inventory", permission: "inventory.manage" },
      { label: "Media", href: "/admin/media", icon: "media", permission: "catalog.view" },
      { label: "Reviews", href: "/admin/reviews", icon: "reviews", permission: "reviews.manage" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: "orders", permission: "orders.view" },
      { label: "Payments", href: "/admin/payments", icon: "payments", permission: "payments.view" },
      { label: "Coupons", href: "/admin/coupons", icon: "coupons", permission: "coupons.manage" },
      { label: "Customers", href: "/admin/customers", icon: "customers", permission: "customers.view" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Staff", href: "/admin/staff", icon: "staff", permission: "staff.manage" },
      { label: "Settings", href: "/admin/settings", icon: "settings", permission: "settings.manage" },
      { label: "Security", href: "/admin/security", icon: "security", permission: "security.view" },
      { label: "System health", href: "/admin/system-health", icon: "health", permission: "security.view" },
    ],
  },
];

/** The sections this person may open. Hiding links is only a convenience: every page checks too. */
export function adminNavFor(permissions: ReadonlySet<Permission>): AdminNavSection[] {
  return ADMIN_NAV.map((section) => ({
    title: section.title,
    items: section.items.filter((item) => permissions.has(item.permission)).map(({ label, href, icon }) => ({ label, href, icon })),
  })).filter((section) => section.items.length > 0);
}

/** The permission a section needs, for the dashboard's "you don't have access" notice. */
export function sectionForPermission(permission: string) {
  for (const section of ADMIN_NAV) {
    const item = section.items.find((entry) => entry.permission === permission);
    if (item) return item.label;
  }
  return null;
}
