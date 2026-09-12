// Roles and permissions. Which role has which permission lives in the database
// (role_permissions); the app reads the signed-in user's list through my_permissions().

export const STAFF_ROLES = ["super_admin", "admin", "manager", "staff"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type UserRole = StaffRole | "customer";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  customer: "Customer",
};

export const PERMISSIONS = [
  "dashboard.view",
  "revenue.view",
  "catalog.view",
  "catalog.manage",
  "inventory.manage",
  "orders.view",
  "orders.manage",
  "orders.cancel",
  "customers.view",
  "coupons.manage",
  "reviews.manage",
  "analytics.view",
  "payments.view",
  "staff.manage",
  "settings.manage",
  "security.view",
  "content.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.view": "View the dashboard",
  "revenue.view": "See revenue figures",
  "catalog.view": "View products, categories and media",
  "catalog.manage": "Edit products, categories and media",
  "inventory.manage": "Adjust stock",
  "orders.view": "View orders",
  "orders.manage": "Update order status",
  "orders.cancel": "Cancel and refund orders",
  "customers.view": "View customers",
  "coupons.manage": "Manage coupons",
  "reviews.manage": "Moderate reviews",
  "analytics.view": "View analytics",
  "payments.view": "View payments",
  "staff.manage": "Manage team members",
  "settings.manage": "Change store settings",
  "security.view": "View security and system health",
  "content.manage": "Edit home page content",
};

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && (STAFF_ROLES as readonly string[]).includes(role);
}

export function toUserRole(role: unknown): UserRole {
  return isStaffRole(role) ? role : "customer";
}
