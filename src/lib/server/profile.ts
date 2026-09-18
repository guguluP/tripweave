import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { twApply } from "@/lib/supabase/rpc";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type Profile = {
  displayName: string;
  phone: string;
  email: string;
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
          const profile = {
            displayName: row.display_name ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
          };
          g.__twProfiles__!.set(context.userId, profile);
          return profile;
        }
      } catch {
        /* RPC may not exist yet */
      }
    }
    return g.__twProfiles__!.get(context.userId) ?? { displayName: "", phone: "", email: "" };
  });

const saveSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().default(""),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("")
    .transform((v) => v),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true; profile: Profile } | { ok: false; message: string }> => {
    const profile: Profile = {
      displayName: data.displayName,
      phone: data.phone ?? "",
      email: data.email?.trim() ?? "",
    };
    g.__twProfiles__!.set(context.userId, profile);
    if (isSupabaseConfigured()) {
      try {
        await twApply("upsert_profile", {
          user_id: context.userId,
          display_name: profile.displayName,
          phone: profile.phone,
          email: profile.email,
        });
      } catch {
        /* keep memory copy */
      }
    }
    return { ok: true, profile };
  });
