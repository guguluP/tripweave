/**
 * Kept so existing RPC signatures still receive p_gate.
 * Postgres no longer trusts this string. Only the service role may execute the functions.
 */
export const SUPABASE_WRITE_GATE = process.env.SUPABASE_WRITE_GATE?.trim() || "service";
