/** Shared env helpers for Supabase. Server-only secrets must never use VITE_. */

export function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    ""
  );
}

export function supabaseAnonKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

/** Service role — server only. Bypasses RLS; always filter by user_id yourself. */
export function supabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

/**
 * True when Supabase is configured for server booking storage.
 * Prefer service role on the server; fall back to anon if only public keys exist.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && (supabaseServiceRoleKey() || supabaseAnonKey()));
}

/** Browser-safe: only public URL + anon key. */
export function isSupabaseBrowserConfigured(): boolean {
  const url =
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_SUPABASE_URL) ||
    "";
  const key =
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_SUPABASE_ANON_KEY) ||
    "";
  return Boolean(url && key);
}
