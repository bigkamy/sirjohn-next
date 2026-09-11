import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Session-aware client for Client Components, used where a file must go straight from the
 * browser to Supabase (media uploads). Row level security still decides what it may do.
 */
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
