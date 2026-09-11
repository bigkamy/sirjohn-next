import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getDashboardStats } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth/dal";
import { getLaunchChecklist } from "@/lib/launch-checklist";
import { listOrdersForAdmin } from "@/lib/orders";

export const metadata = { title: "Admin Dashboard" };

export default async function Page() {
  await requireAdmin("/admin");
  const [stats, { orders }, checklist] = await Promise.all([
    getDashboardStats(),
    listOrdersForAdmin({ pageSize: 8 }),
    getLaunchChecklist(),
  ]);
  return <AdminDashboard stats={stats} recentOrders={orders} checklist={checklist} />;
}
