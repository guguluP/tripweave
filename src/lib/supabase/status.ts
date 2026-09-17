import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdmin } from "./server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "./env";

export type PersistStatus =
  | { cloud: true }
  | { cloud: false; reason: "keys" | "schema" | "error" };

/**
 * Whether bookings can persist to the live TripWeave Supabase project.
 * No row data is returned.
 */
export const getPersistStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<PersistStatus> => {
    if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
      return { cloud: false, reason: "keys" };
    }
    const sb = getSupabaseAdmin();
    if (!sb) return { cloud: false, reason: "keys" };
    try {
      const { error } = await sb.from("bookings").select("id").limit(1);
      if (!error) return { cloud: true };
      const msg = error.message.toLowerCase();
      if (msg.includes("schema cache") || msg.includes("does not exist") || msg.includes("could not find")) {
        return { cloud: false, reason: "schema" };
      }
      console.error("[supabase] persist status", error.message);
      return { cloud: false, reason: "error" };
    } catch (err) {
      console.error("[supabase] persist status failed", err);
      return { cloud: false, reason: "error" };
    }
  },
);
