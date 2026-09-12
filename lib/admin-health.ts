import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { isEmailConfigured } from "@/lib/email/send";
import { MEDIA_BUCKET, MEDIA_FOLDER } from "@/lib/media";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site-url";

export type CheckStatus = "ok" | "warning" | "error";
export type HealthCheck = { name: string; status: CheckStatus; detail: string; latencyMs?: number };

export type SystemHealth = {
  checkedAt: string;
  checks: HealthCheck[];
  databaseVersion: string | null;
  latestMigration: string | null;
  counts: { products: number; orders: number; customers: number; staff: number; pendingReviews: number } | null;
  tablesWithoutRls: string[];
  recentErrors: { createdAt: string; action: string; summary: string }[];
  siteUrl: string;
};

async function timed<T>(run: () => Promise<T>) {
  const started = performance.now();
  const value = await run();
  return { value, ms: Math.round(performance.now() - started) };
}

type HealthPayload = {
  database_version: string;
  latest_migration: string | null;
  media_bucket: boolean | null;
  counts: { products: number; orders: number; customers: number; staff: number; pending_reviews: number };
  tables_without_rls: string[];
  recent_errors: { created_at: string; action: string; summary: string }[];
};

/**
 * Whether order confirmation emails can go out, and whether any have failed. The provider
 * isn't called: a send-only API key is allowed to do nothing but send, so a test request
 * would report a false failure.
 */
function emailCheck(failed: number, latencyMs: number): HealthCheck {
  if (!isEmailConfigured()) {
    return {
      name: "Email",
      status: "warning",
      detail: "Not configured — order confirmation emails aren't being sent. Set RESEND_API_KEY and ORDER_EMAIL_FROM.",
    };
  }
  if (failed > 0) {
    return {
      name: "Email",
      status: "warning",
      detail: `${failed} order ${failed === 1 ? "confirmation email has" : "confirmation emails have"} failed. Open the order to see why and resend.`,
      latencyMs,
    };
  }
  return { name: "Email", status: "ok", detail: "Configured · no failed order confirmations", latencyMs };
}

/** Live checks of the database, Supabase API, authentication, storage and email, run on each visit. */
export async function getSystemHealth(): Promise<SystemHealth> {
  const staff = await requirePermission("security.view", "/admin/system-health");
  const supabase = await createClient();

  const [database, api, auth, storage, failedEmails] = await Promise.all([
    timed(async () => supabase.rpc("admin_system_health")),
    timed(async () => {
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/health`, { headers: { apikey: supabaseAnonKey }, cache: "no-store" });
        return response.ok;
      } catch {
        return false;
      }
    }),
    timed(async () => supabase.auth.getUser()),
    timed(async () => supabase.storage.from(MEDIA_BUCKET).list(MEDIA_FOLDER, { limit: 1 })),
    timed(async () => supabase.from("orders").select("id", { count: "exact", head: true }).eq("confirmation_email_status", "failed")),
  ]);

  const health = database.value.error ? null : (database.value.data as HealthPayload);
  const checks: HealthCheck[] = [
    health
      ? { name: "Database", status: "ok", detail: `Connected · PostgreSQL ${health.database_version}`, latencyMs: database.ms }
      : { name: "Database", status: "error", detail: database.value.error?.message ?? "No response", latencyMs: database.ms },
    api.value
      ? { name: "Supabase API", status: "ok", detail: "Reachable", latencyMs: api.ms }
      : { name: "Supabase API", status: "error", detail: "The Supabase API didn't respond", latencyMs: api.ms },
    auth.value.data.user
      ? { name: "Authentication", status: "ok", detail: `Session verified for ${staff.user.email}`, latencyMs: auth.ms }
      : { name: "Authentication", status: "error", detail: auth.value.error?.message ?? "Session could not be verified", latencyMs: auth.ms },
    storage.value.error
      ? { name: "Storage", status: "error", detail: `Media library unavailable: ${storage.value.error.message}`, latencyMs: storage.ms }
      : health?.media_bucket === false
        ? { name: "Storage", status: "warning", detail: "The media bucket is missing", latencyMs: storage.ms }
        : { name: "Storage", status: "ok", detail: "Media library reachable", latencyMs: storage.ms },
    emailCheck(failedEmails.value.count ?? 0, failedEmails.ms),
  ];

  return {
    checkedAt: new Date().toISOString(),
    checks,
    databaseVersion: health?.database_version ?? null,
    latestMigration: health?.latest_migration ?? null,
    counts: health
      ? {
          products: Number(health.counts.products),
          orders: Number(health.counts.orders),
          customers: Number(health.counts.customers),
          staff: Number(health.counts.staff),
          pendingReviews: Number(health.counts.pending_reviews),
        }
      : null,
    tablesWithoutRls: health?.tables_without_rls ?? [],
    recentErrors: (health?.recent_errors ?? []).map((error) => ({ createdAt: error.created_at, action: error.action, summary: error.summary })),
    siteUrl,
  };
}
