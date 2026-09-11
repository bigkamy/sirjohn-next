// Values left unchanged from .env.example count as "not configured".
const EXAMPLE_URL = "https://your-project.supabase.co";
const EXAMPLE_KEY = "your-anon-key";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const notConfiguredMessage =
  "Accounts are unavailable until Supabase is configured. See supabase/README.md.";

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl && supabaseAnonKey && supabaseUrl !== EXAMPLE_URL && supabaseAnonKey !== EXAMPLE_KEY,
  );
}
