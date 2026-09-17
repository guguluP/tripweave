import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PROJECT_URL } from "./project.ts";

let browserClient: SupabaseClient | null = null;

/**
 * Browser Supabase client (anon / publishable key only).
 * Returns null when VITE_SUPABASE_* key is not set.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = (import.meta.env.VITE_SUPABASE_URL?.trim() || SUPABASE_PROJECT_URL).trim();
  const key = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
