/** Shared env helpers for Supabase. Server-only secrets must never use VITE_. */

function pick(...vals: Array<string | undefined>): string {
  for (const v of vals) {
    const t = v?.trim();
    if (t) return t;
  }
  return "";
}

/** Accept a raw key or Edge-style JSON `{"default":"sb_..."}`. */
function fromNamedJson(raw: string | undefined): string {
  const t = raw?.trim();
  if (!t) return "";
  if (t.startsWith("{")) {
    try {
      const obj = JSON.parse(t) as Record<string, unknown>;
      const def = obj.default ?? Object.values(obj)[0];
      return typeof def === "string" ? def.trim() : "";
    } catch {
      return "";
    }
  }
  return t;
}

export function supabaseUrl(): string {
  return pick(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL);
}

/** Public / anon / publishable key. Safe for the browser. */
export function supabaseAnonKey(): string {
  return pick(
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    fromNamedJson(process.env.SUPABASE_PUBLISHABLE_KEYS),
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Service role / secret — server only. Bypasses RLS; always filter by user_id.
 * Never read VITE_ here.
 */
export function supabaseServiceRoleKey(): string {
  return pick(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
    fromNamedJson(process.env.SUPABASE_SECRET_KEYS),
  );
}

/**
 * True when Supabase is configured for server booking storage.
 * Prefer service/secret on the server; fall back to anon/publishable.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && (supabaseServiceRoleKey() || supabaseAnonKey()));
}

/** Browser-safe: only public URL + anon/publishable key. */
export function isSupabaseBrowserConfigured(): boolean {
  const env =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env
      : undefined;
  const url = pick(env?.VITE_SUPABASE_URL);
  const key = pick(env?.VITE_SUPABASE_ANON_KEY, env?.VITE_SUPABASE_PUBLISHABLE_KEY);
  return Boolean(url && key);
}
