import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "./env";

export type { SupabaseClient };

/**
 * Server-side Supabase client.
 * Uses the service role when available (bypasses RLS — always scope queries by user id).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const url = supabaseUrl();
  const key = supabaseServiceRoleKey() || supabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
