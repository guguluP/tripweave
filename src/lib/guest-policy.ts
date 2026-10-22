import type { GuestDetailsPolicy } from "./hotel-desk.ts";

export type GuestRole = "lead" | "companion";
export type AgeBand = "adult" | "child_5_11" | "infant_0_4";

export type GuestField =
  | "fullName"
  | "phone"
  | "email"
  | "dateOfBirth"
  | "nationality"
  | "idType"
  | "idNumber"
  | "ageBand";

const LEAD_FIELDS: GuestField[] = [
  "fullName",
  "phone",
  "email",
  "dateOfBirth",
  "nationality",
  "idType",
  "idNumber",
];

const FOREIGN_FIELDS: GuestField[] = ["fullName", "nationality", "idType", "idNumber", "dateOfBirth"];

/**
 * Fields the guest must fill.
 * Non-Indian nationality always needs a passport and date of birth, whatever the hotel policy.
 * A foreign lead still gives phone and email so the desk can reach them.
 */
export function requiredFields(
  role: GuestRole,
  policy: GuestDetailsPolicy,
  nationality: string,
  isChild: boolean,
): GuestField[] {
  const nat = (nationality || "IN").trim().toUpperCase();
  if (nat !== "IN") {
    if (role === "lead") return [...FOREIGN_FIELDS, "phone", "email"];
    return [...FOREIGN_FIELDS];
  }
  if (role === "lead") return [...LEAD_FIELDS];
  if (policy === "all_adults_id" && !isChild) return ["fullName", "ageBand", "idType", "idNumber"];
  return ["fullName", "ageBand"];
}

export function isChildBand(ageBand: string | undefined | null): boolean {
  return ageBand === "child_5_11" || ageBand === "infant_0_4";
}
