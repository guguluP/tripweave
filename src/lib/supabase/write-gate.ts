/**
 * Server-only gate for public.tw_apply. Never import this from a client module.
 * Override with SUPABASE_WRITE_GATE if you rotate it in SQL.
 */
export const SUPABASE_WRITE_GATE =
  process.env.SUPABASE_WRITE_GATE?.trim() || "twg_6fc5976ec6ca8ce5a99ec06cb98d6a98";
