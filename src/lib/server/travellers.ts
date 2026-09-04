import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sbSaveTravellers } from "@/lib/supabase/travellers";

const travelerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  specialRequests: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  identitySource: z.string().optional(),
});

const saveSchema = z.object({
  travelers: z.array(travelerSchema).min(1).max(12),
  bookingId: z.number().int().optional().nullable(),
});

export const saveTravellers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    if (!isSupabaseConfigured()) {
      return { ok: true as const, stored: "local" as const };
    }
    try {
      await sbSaveTravellers(context.userId, data.travelers, data.bookingId);
      return { ok: true as const, stored: "supabase" as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save travellers.";
      return { ok: false as const, message };
    }
  });
