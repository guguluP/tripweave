import { z } from "zod";
import type { GuestDetailsPolicy } from "./hotel-desk";
import { guestErrorBanner } from "./focus-first-error";
import {
  emptyTraveler,
  orderedGuestErrors,
  validateTravelers,
  type AgeBand,
  type GuestRole,
  type Traveler,
} from "./travelers";

const ageBands = ["adult", "child_5_11", "infant_0_4"] as const;

/** Loose shape. guest-policy.ts decides which fields are actually required. */
export const travelerInputSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().max(20).optional().default(""),
  email: z.string().max(160).optional().default(""),
  dateOfBirth: z.string().max(20).optional().default(""),
  nationality: z.string().max(8).optional().default("IN"),
  idType: z.string().max(20).optional().default(""),
  idNumber: z.string().max(40).optional().default(""),
  emergencyName: z.string().max(120).optional().default(""),
  emergencyPhone: z.string().max(20).optional().default(""),
  digiYatra: z.string().max(40).optional(),
  role: z.enum(["lead", "companion"]).optional(),
  ageBand: z.enum(ageBands).optional(),
  isLead: z.boolean().optional(),
  gender: z.string().max(20).optional(),
  specialRequests: z.string().max(500).optional(),
});

export type TravelerInput = z.infer<typeof travelerInputSchema>;

export const travelerListSchema = z.array(travelerInputSchema).min(1).max(12);

type RawGuest = TravelerInput & { role?: GuestRole; isLead?: boolean; ageBand?: AgeBand };

/**
 * Old clients omit is_lead / role. The first row becomes the lead.
 * An explicit list of companions with no lead is rejected.
 */
export function guestRowsFromInput(
  input: unknown,
  policy: GuestDetailsPolicy = "lead_only",
): { ok: true; guests: Traveler[] } | { ok: false; message: string } {
  const parsed = travelerListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check guest details." };
  const rows = parsed.data as RawGuest[];
  const explicit = rows.some((row) => row.role != null || row.isLead != null);
  const anyLead = rows.some((row) => row.role === "lead" || row.isLead === true);
  if (explicit && !anyLead) return { ok: false, message: "A lead guest is required." };
  const guests = rows.map((row, index) => {
    const lead = anyLead ? row.role === "lead" || row.isLead === true : index === 0;
    return emptyTraveler(
      {
        fullName: row.fullName,
        phone: row.phone || "",
        email: row.email || "",
        dateOfBirth: row.dateOfBirth || "",
        nationality: (row.nationality || "IN").toUpperCase(),
        idType: (row.idType as Traveler["idType"]) || (lead ? "aadhaar" : "aadhaar"),
        idNumber: row.idNumber || "",
        emergencyName: row.emergencyName || "",
        emergencyPhone: row.emergencyPhone || "",
        digiYatra: row.digiYatra === "enrolled" || row.digiYatra === "shared" ? row.digiYatra : "not_started",
        ageBand: row.ageBand,
        role: lead ? "lead" : "companion",
        specialRequests: row.specialRequests || "",
      },
      index,
    );
  });
  const result = validateTravelers(guests, policy);
  if (!result.ok) {
    const fields = orderedGuestErrors(guests, policy);
    return { ok: false, message: guestErrorBanner(fields) || "Check guest details." };
  }
  return { ok: true, guests };
}
