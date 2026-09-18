import { createServerFn } from "@tanstack/react-start";
import { twApply } from "./rpc";
import { isSupabaseConfigured } from "./env";

export type PersistStatus =
  | { cloud: true }
  | { cloud: false; reason: "keys" | "schema" | "error" };

/**
 * Whether bookings can persist to the live TripWeave Supabase project.
 * No row data is returned.
 */
export const getPersistStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<PersistStatus> => {
    if (!isSupabaseConfigured()) {
      return { cloud: false, reason: "keys" };
    }
    try {
      const ping = await twApply<{ ok?: boolean }>("ping", {});
      if (ping?.ok) return { cloud: true };
      return { cloud: false, reason: "error" };
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("schema") || msg.includes("does not exist") || msg.includes("could not find")) {
        return { cloud: false, reason: "schema" };
      }
      console.error("[supabase] persist status failed", err);
      return { cloud: false, reason: "error" };
    }
  },
);
