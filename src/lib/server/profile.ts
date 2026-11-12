import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { twApply } from "@/lib/supabase/rpc";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type Profile = {
  displayName: string;
  phone: string;
  email: string;
  homeCity: string;
  whatsappOptIn: boolean;
};

const g = globalThis as typeof globalThis & { __twProfiles__?: Map<string, Profile> };
if (!g.__twProfiles__) g.__twProfiles__ = new Map();

export const getProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Profile> => {
    if (isSupabaseConfigured()) {
      try {
        const row = await twApply<{ display_name?: string; phone?: string; email?: string } | null>(
          "get_profile",
          { user_id: context.userId },
        );
        if (row && typeof row === "object") {
          const extra = row as { home_city?: string; whatsapp_opt_in?: boolean };
          const profile = {
            displayName: row.display_name ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            homeCity: extra.home_city ?? "",
            whatsappOptIn: extra.whatsapp_opt_in === true,
          };
          g.__twProfiles__!.set(context.userId, profile);
          return profile;
        }
      } catch {
        /* RPC may not exist yet */
      }
    }
    return (
      g.__twProfiles__!.get(context.userId) ?? {
        displayName: "",
        phone: "",
        email: "",
        homeCity: "",
        whatsappOptIn: false,
      }
    );
  });

const saveSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().default(""),
  email: z.string().trim().max(120).optional().default(""),
  homeCity: z.string().trim().max(80).optional().default(""),
  whatsappOptIn: z.boolean().optional().default(false),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }): Promise<
    { ok: true; profile: Profile; homeCity: "account" | "device" } | { ok: false; message: string }
  > => {
    const sessionEmail = context.email?.trim().toLowerCase() ?? "";
    const requested = data.email?.trim().toLowerCase() ?? "";
    if (requested && sessionEmail && requested !== sessionEmail) {
      return { ok: false, message: "Profile email must match the address you signed in with." };
    }
    const profile: Profile = {
      displayName: data.displayName,
      phone: data.phone ?? "",
      email: sessionEmail,
      homeCity: data.homeCity ?? "",
      whatsappOptIn: data.whatsappOptIn === true,
    };
    if (!isSupabaseConfigured()) {
      g.__twProfiles__!.set(context.userId, profile);
      return { ok: true, profile, homeCity: "device" };
    }
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, message: "Profile was not saved." };
    const row = {
      user_id: context.userId,
      display_name: profile.displayName,
      phone: profile.phone,
      email: profile.email,
      home_city: profile.homeCity,
      whatsapp_opt_in: profile.whatsappOptIn,
      updated_at: new Date().toISOString(),
    };
    const saved = await sb.from("profiles").upsert(row, { onConflict: "user_id" });
    if (!saved.error) {
      g.__twProfiles__!.set(context.userId, profile);
      return { ok: true, profile, homeCity: "account" };
    }
    const missingColumn = /home_city|whatsapp_opt_in|column/i.test(saved.error.message);
    if (!missingColumn) return { ok: false, message: "Profile was not saved." };
    try {
      await twApply("upsert_profile", {
        user_id: context.userId,
        display_name: profile.displayName,
        phone: profile.phone,
        email: profile.email,
      });
    } catch {
      return { ok: false, message: "Profile was not saved." };
    }
    g.__twProfiles__!.set(context.userId, profile);
    return { ok: true, profile, homeCity: "device" };
  });

/** Erases the profile, saved people, and saved hotels. Paid stays stay until you cancel them. */
export const deleteAccountData = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true } | { ok: false; message: string }> => {
    g.__twProfiles__!.delete(context.userId);
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, message: "Account data could not be deleted." };
    const [profile, stays, people] = await Promise.all([
      sb.from("profiles").delete().eq("user_id", context.userId),
      sb.from("saved_stays").delete().eq("user_id", context.userId),
      sb.from("saved_travellers").delete().eq("user_id", context.userId),
    ]);
    const failed = [profile.error, stays.error, people.error].filter(Boolean);
    if (failed.length === 3) return { ok: false, message: "Account data could not be deleted." };
    return { ok: true };
  });
