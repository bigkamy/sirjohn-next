import "server-only";
import { createClient } from "@/lib/supabase/server";

async function record(level: "info" | "error", action: string, entityType: string, entityId: string | null, summary: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_staff_activity", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_summary: summary.slice(0, 300),
      p_level: level,
    });
  } catch {
    // Logging must never break the action it describes.
  }
}

/** Logs a failed admin action; it appears under "Recent errors" on the System health page. */
export async function logAdminError(action: string, entityType: string, entityId: string | null, message: string) {
  console.error(`${action} failed:`, message);
  await record("error", action, entityType, entityId, message);
}

/** Records an admin event the database can't see for itself, such as a media upload. */
export async function logAdminEvent(action: string, entityType: string, entityId: string | null, summary: string) {
  await record("info", action, entityType, entityId, summary);
}
