import "server-only";
import { requireStaff } from "@/lib/auth/dal";
import { toUserRole, type UserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type ActivityEntry = {
  id: number;
  actorId: string | null;
  /** "System" for changes with no signed-in actor (payment webhooks, SQL). */
  actorName: string;
  actorRole: UserRole | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  level: "info" | "error";
  createdAt: string;
};

type ActivityRow = {
  id: number;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  level: "info" | "error";
  created_at: string;
};

/**
 * Recent staff activity. Row level security decides what each role sees: security and team
 * managers see everything, other staff only the history of orders.
 */
export async function listActivity({
  limit = 10,
  actorId,
  entityType,
  entityId,
  actionPrefix,
}: { limit?: number; actorId?: string; entityType?: string; entityId?: string; actionPrefix?: string } = {}): Promise<ActivityEntry[]> {
  await requireStaff("/admin");
  const supabase = await createClient();

  let query = supabase
    .from("staff_activity")
    .select("id,actor_id,actor_role,action,entity_type,entity_id,summary,level,created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (actorId) query = query.eq("actor_id", actorId);
  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);
  if (actionPrefix) query = query.like("action", `${actionPrefix}%`);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load activity: ${error.message}`);
  }
  const rows = data as ActivityRow[];

  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id,first_name,last_name").in("id", actorIds);
    for (const profile of profiles ?? []) {
      const name = `${profile.first_name} ${profile.last_name}`.trim();
      if (name) names.set(profile.id, name);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_id ? (names.get(row.actor_id) ?? "Team member") : "System",
    actorRole: row.actor_role ? toUserRole(row.actor_role) : null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    level: row.level,
    createdAt: row.created_at,
  }));
}
