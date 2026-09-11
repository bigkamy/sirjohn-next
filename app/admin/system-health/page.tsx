import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { Card, CardHeader, DetailList, EmptyState, PageHeader, StatCard } from "@/components/admin/ui/primitives";
import { getSystemHealth, type CheckStatus } from "@/lib/admin-health";
import { requirePermission } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "System health" };

const STATUS = {
  ok: { label: "Operational", icon: CircleCheck, className: "text-emerald-600" },
  warning: { label: "Needs attention", icon: TriangleAlert, className: "text-amber-600" },
  error: { label: "Unavailable", icon: CircleX, className: "text-red-600" },
} satisfies Record<CheckStatus, unknown>;

export default async function Page() {
  await requirePermission("security.view", "/admin/system-health");
  const health = await getSystemHealth();
  const allOk = health.checks.every((check) => check.status === "ok");

  return (
    <>
      <PageHeader title="System health" description={`Checked live at ${formatDateTime(health.checkedAt)}. Reload the page to check again.`} />

      <Card>
        <CardHeader title={allOk ? "All systems operational" : "Some checks need attention"} />
        <ul className="divide-y divide-slate-100">
          {health.checks.map((check) => {
            const status = STATUS[check.status];
            const Icon = status.icon;
            return (
              <li key={check.name} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Icon size={20} className={status.className} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{check.name}</p>
                  <p className="text-sm text-slate-500">{check.detail}</p>
                </div>
                <div className="text-right text-sm">
                  <p className={`font-medium ${status.className}`}>{status.label}</p>
                  {check.latencyMs !== undefined && <p className="text-xs tabular-nums text-slate-500">{check.latencyMs} ms</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {health.counts && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Products" value={String(health.counts.products)} />
          <StatCard label="Orders" value={String(health.counts.orders)} />
          <StatCard label="Customers" value={String(health.counts.customers)} />
          <StatCard label="Team members" value={String(health.counts.staff)} />
          <StatCard label="Reviews to moderate" value={String(health.counts.pendingReviews)} />
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Environment" />
          <DetailList
            items={[
              { label: "Database", value: health.databaseVersion ? `PostgreSQL ${health.databaseVersion}` : "Unknown" },
              { label: "Latest migration", value: health.latestMigration ?? "Not recorded (applied without the Supabase CLI)" },
              { label: "Site URL", value: health.siteUrl },
              {
                label: "Row level security",
                value:
                  health.tablesWithoutRls.length === 0 ? (
                    "Enabled on every table"
                  ) : (
                    <span className="font-medium text-red-700">Missing on: {health.tablesWithoutRls.join(", ")}</span>
                  ),
              },
            ]}
          />
        </Card>

        <Card>
          <CardHeader title="Recent errors" description="Failed admin actions, newest first. Server logs are in the Supabase dashboard under Logs." />
          {health.recentErrors.length === 0 ? (
            <EmptyState title="No errors recorded" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {health.recentErrors.map((error, index) => (
                <li key={`${error.createdAt}-${index}`} className="px-5 py-3">
                  <p className="text-sm text-slate-800">{error.summary}</p>
                  <p className="text-xs text-slate-500">
                    {error.action} · {formatDateTime(error.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
