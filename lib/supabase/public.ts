import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

let client: SupabaseClient | undefined;

/**
 * Cookie-free anon client for public data such as the catalog. It never reads the
 * request, so pages that use it can still be statically generated.
 */
export function createPublicClient() {
  client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
