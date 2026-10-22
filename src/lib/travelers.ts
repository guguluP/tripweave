/** Guest / traveller profile collected before payment. */

import { isCountryCode } from "./countries.ts";
import { isChildBand, requiredFields, type AgeBand, type GuestField, type GuestRole } from "./guest-policy.ts";
import type { GuestDetailsPolicy } from "./hotel-desk.ts";
import { isAcceptablePhone, toE164 } from "./phone.ts";

export type { AgeBand, GuestRole };

export type IdType = "aadhaar" | "passport" | "dl" | "voter" | "other";
export const ARRIVAL_PURPOSES = [
  "tourism",
  "business",
  "employment",
  "medical",
  "student",
  "conference",
  "others",
] as const;
export type ArrivalPurpose = (typeof ARRIVAL_PURPOSES)[number];
export type Gender = "female" | "male" | "other" | "prefer_not";
export type IdentitySource = "manual" | "digilocker_demo" | "digilocker";
export type DigiYatraStatus = "not_started" | "enrolled" | "shared";

export type IssuedDoc = {
  type: IdType;
  label: string;
  issuer: string;
  idMasked: string;
  verifiedAt: string;
};

export type Traveler = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  idType: IdType;
  idNumber: string;
  /** Optional free-text needs (diet, accessibility, etc.). */
  specialRequests: string;
  emergencyName: string;
  emergencyPhone: string;
  identitySource: IdentitySource;
  issuedDocs: IssuedDoc[];
  digiYatra: DigiYatraStatus;
  role: GuestRole;
  ageBand?: AgeBand;
  /** Client-only. Not a visa number and not sent to the server. */
  oci?: boolean;
  /** Client-only. UAE visa-on-arrival needs a previous Indian visa. Not stored. */
  priorIndianVisa?: boolean;
  arrivedFrom?: string;
  arrivalTime?: string;
  arrivalPurpose?: ArrivalPurpose | "";
  previousStay?: string;
  nextDestination?: string;
};

export const TRAVELERS_KEY = "tripweave-travelers";

const AGE_BANDS = new Set<AgeBand>(["adult", "child_5_11", "infant_0_4"]);

export function emptyTraveler(overrides: Partial<Traveler> = {}, index = 0): Traveler {
  const role = overrides.role ?? (index === 0 ? "lead" : "companion");
  return {
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "prefer_not",
    nationality: "IN",
    idType: "aadhaar",
    idNumber: "",
    specialRequests: "",
    emergencyName: "",
    emergencyPhone: "",
    identitySource: "manual",
    issuedDocs: [],
    digiYatra: "not_started",
    ageBand: undefined,
    ...overrides,
    role,
  };
}

export function defaultIdType(nationality: string): IdType {
  return (nationality || "IN").trim().toUpperCase() === "IN" ? "aadhaar" : "passport";
}

function cleanNationality(value: unknown): string {
  if (typeof value !== "string") return "IN";
  const upper = value.trim().toUpperCase();
  return upper || "IN";
}

function cleanPhone(raw: string, nationality: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return toE164(trimmed, nationality || "IN") ?? trimmed;
}

export function coerceTraveler(raw: unknown): Traveler | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Traveler> & Record<string, unknown>;
  const nationality = cleanNationality(t.nationality);
  const idType = (t.idType as IdType) || defaultIdType(nationality);
  const purpose = ARRIVAL_PURPOSES.includes(t.arrivalPurpose as ArrivalPurpose)
    ? (t.arrivalPurpose as ArrivalPurpose)
    : "";
  return emptyTraveler({
    fullName: typeof t.fullName === "string" ? t.fullName : "",
    phone: cleanPhone(typeof t.phone === "string" ? t.phone : "", nationality),
    email: typeof t.email === "string" ? t.email : "",
    dateOfBirth: typeof t.dateOfBirth === "string" ? t.dateOfBirth : "",
    gender: (t.gender as Gender) || "prefer_not",
    nationality,
    idType,
    idNumber: maskStoredId(idType, typeof t.idNumber === "string" ? t.idNumber : ""),
    specialRequests: typeof t.specialRequests === "string" ? t.specialRequests : "",
    emergencyName: typeof t.emergencyName === "string" ? t.emergencyName : "",
    emergencyPhone: cleanPhone(typeof t.emergencyPhone === "string" ? t.emergencyPhone : "", nationality),
    identitySource: (t.identitySource as IdentitySource) || "manual",
    issuedDocs: Array.isArray(t.issuedDocs) ? (t.issuedDocs as IssuedDoc[]) : [],
    digiYatra: (t.digiYatra as DigiYatraStatus) || "not_started",
    role: t.role === "companion" ? "companion" : t.role === "lead" ? "lead" : "lead",
    ageBand: AGE_BANDS.has(t.ageBand as AgeBand) ? (t.ageBand as AgeBand) : undefined,
    oci: t.oci === true,
    priorIndianVisa: t.priorIndianVisa === true,
    arrivedFrom: typeof t.arrivedFrom === "string" ? t.arrivedFrom : "",
    arrivalTime: typeof t.arrivalTime === "string" ? t.arrivalTime : "",
    arrivalPurpose: purpose,
    previousStay: typeof t.previousStay === "string" ? t.previousStay : "",
    nextDestination: typeof t.nextDestination === "string" ? t.nextDestination : "",
  });
}

/** Full Aadhaar never goes to localStorage. Last 4 only. */
export function maskAadhaar(idNumber: string): string {
  const digits = idNumber.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return digits.slice(-4);
}

function maskStoredId(idType: IdType, idNumber: string) {
  return idType === "aadhaar" ? maskAadhaar(idNumber) : idLast4(idNumber);
}

export function persistTraveler(t: Traveler): Traveler {
  const idNumber = maskStoredId(t.idType, t.idNumber);
  return idNumber === t.idNumber ? t : { ...t, idNumber };
}

export function saveTravelers(list: Traveler[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRAVELERS_KEY, JSON.stringify(list.map(persistTraveler)));
  } catch {
    /* ignore */
  }
}

export function loadTravelers(): Traveler[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRAVELERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(coerceTraveler).filter((t): t is Traveler => t !== null);
  } catch {
    return [];
  }
}

export function clearTravelers() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TRAVELERS_KEY);
  } catch {
    /* ignore */
  }
}

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TravelerErrors = Partial<Record<keyof Traveler, string>>;

export const GUEST_FIELD_LABELS: Record<GuestField, string> = {
  fullName: "full name",
  phone: "mobile",
  email: "email",
  dateOfBirth: "date of birth",
  nationality: "nationality",
  idType: "ID type",
  idNumber: "ID number",
  ageBand: "age band",
};

function checkDob(value: string): string | null {
  if (!value) return "Date of birth is required.";
  const dob = new Date(`${value}T12:00:00`);
  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (Number.isNaN(dob.getTime()) || age < 0 || age > 120) return "Check the date of birth.";
  return null;
}

function checkId(t: Traveler, foreign: boolean): string | null {
  const id = t.idNumber.replace(/\s/g, "").replace(/-/g, "");
  if (foreign || t.idType === "passport") {
    if (id.length < 6 && id.length !== 4) return "Enter passport number.";
    return null;
  }
  if (t.idType === "aadhaar") {
    if (!/^\d{12}$/.test(id) && !/^\d{4}$/.test(id) && !/^x{8}\d{4}$/i.test(id)) {
      return "Enter 12-digit Aadhaar or last 4 digits.";
    }
    return null;
  }
  if (!id) return "ID number is required.";
  return null;
}

export function validateTraveler(
  t: Traveler,
  ctx?: { policy?: GuestDetailsPolicy; index?: number },
): TravelerErrors {
  const policy = ctx?.policy ?? "lead_only";
  const index = ctx?.index ?? 0;
  const role: GuestRole = index === 0 ? "lead" : t.role === "lead" ? "lead" : "companion";
  const nat = (t.nationality || "IN").trim().toUpperCase();
  const foreign = nat !== "IN";
  const needed = new Set(requiredFields(role, policy, nat, isChildBand(t.ageBand)));
  const e: TravelerErrors = {};
  if (needed.has("fullName") && t.fullName.trim().length < 2) e.fullName = "Enter the name as on the ID.";
  const phoneRegion = nat || "IN";
  if (needed.has("phone") || t.phone.trim()) {
    const problem = phoneProblem(t.phone, phoneRegion);
    if (problem) e.phone = problem;
  }
  if (needed.has("email")) {
    if (!EMAIL_RE.test(t.email.trim())) e.email = "Enter a valid email.";
  } else if (t.email.trim() && !EMAIL_RE.test(t.email.trim())) {
    e.email = "Enter a valid email.";
  }
  if (needed.has("dateOfBirth")) {
    const dob = checkDob(t.dateOfBirth);
    if (dob) e.dateOfBirth = dob;
  }
  if (needed.has("nationality") && !t.nationality.trim()) e.nationality = "Nationality is required.";
  else if ((needed.has("nationality") || t.nationality.trim()) && !isCountryCode(nat)) {
    e.nationality = "Pick a nationality from the list.";
  }
  if (needed.has("ageBand") && !t.ageBand) e.ageBand = "Age band is required.";
  if (foreign && needed.has("idType") && t.idType !== "passport") {
    e.idType = "Passport is required.";
  }
  if (needed.has("idNumber") || needed.has("idType")) {
    const idError = checkId(t, foreign);
    if (idError) e.idNumber = idError;
  }
  if (t.emergencyPhone.trim()) {
    const problem = phoneProblem(t.emergencyPhone, phoneRegion);
    if (problem) e.emergencyPhone = problem;
  }
  return e;
}

function phoneProblem(raw: string, region: string): string | null {
  const trimmed = raw.trim();
  const indianMessage = "Use a 10-digit Indian mobile number.";
  const intlMessage = "Enter a mobile number with country code, e.g. +44 7911 123456.";
  if (!trimmed) return (region || "IN").toUpperCase() === "IN" ? indianMessage : intlMessage;
  const e164 = toE164(trimmed, region || "IN");
  if (e164 && isAcceptablePhone(e164)) return null;
  const digits = trimmed.replace(/\D/g, "");
  const indian = (region || "IN").toUpperCase() === "IN" || trimmed.startsWith("+91") || PHONE_RE.test(digits);
  return indian ? indianMessage : intlMessage;
}

export function validateTravelers(list: Traveler[], policy: GuestDetailsPolicy = "lead_only"): {
  ok: boolean;
  errors: TravelerErrors[];
} {
  if (list.length < 1) return { ok: false, errors: [{}] };
  const errors = list.map((t, index) =>
    validateTraveler({ ...t, role: index === 0 ? "lead" : t.role === "lead" ? "companion" : (t.role ?? "companion") }, {
      policy,
      index,
    }),
  );
  const ok = errors.every((e) => Object.keys(e).length === 0);
  return { ok, errors };
}

const FIELD_ORDER: GuestField[] = [
  "fullName",
  "ageBand",
  "phone",
  "email",
  "dateOfBirth",
  "nationality",
  "idType",
  "idNumber",
];

export function orderedGuestErrors(
  list: Traveler[],
  policy: GuestDetailsPolicy = "lead_only",
): { id: string; guestIndex: number; label: string; field: GuestField }[] {
  const { errors } = validateTravelers(list, policy);
  const out: { id: string; guestIndex: number; label: string; field: GuestField }[] = [];
  errors.forEach((err, guestIndex) => {
    for (const field of FIELD_ORDER) {
      if (err[field]) {
        out.push({
          id: `guest-${guestIndex}-${field}`,
          guestIndex,
          label: GUEST_FIELD_LABELS[field],
          field,
        });
      }
    }
  });
  return out;
}

export function travelerInitials(t: Traveler, fallbackIndex: number) {
  const parts = t.fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return String(fallbackIndex + 1);
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

export const GUEST_RETENTION_DAYS = 14;

/** Last 4 digits only — never persist the full ID. */
export function idLast4(idNumber: string): string {
  const digits = idNumber.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  const raw = idNumber.replace(/\s/g, "");
  return raw.slice(-4);
}

export function guestExpiresAt(checkIn: string, nights: number, extraDays = GUEST_RETENTION_DAYS): string {
  const d = new Date(`${checkIn}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + extraDays);
    return fallback.toISOString();
  }
  d.setDate(d.getDate() + Math.max(1, nights) + extraDays);
  return d.toISOString();
}

/** Wipe ID numbers and DigiLocker docs from the local draft after payment. */
export function clearSensitiveTravelers() {
  if (typeof window === "undefined") return;
  try {
    const list = loadTravelers().map((t) =>
      emptyTraveler({
        fullName: t.fullName,
        phone: t.phone,
        email: t.email,
        nationality: t.nationality,
        idType: t.idType,
        idNumber: idLast4(t.idNumber),
        emergencyName: t.emergencyName,
        emergencyPhone: t.emergencyPhone,
        digiYatra: t.digiYatra,
        identitySource: t.identitySource === "manual" ? "manual" : "digilocker_demo",
        issuedDocs: [],
        dateOfBirth: "",
        specialRequests: "",
      }),
    );
    saveTravelers(list);
  } catch {
    clearTravelers();
  }
}

export const ID_LABELS: Record<IdType, string> = {
  aadhaar: "Aadhaar",
  passport: "Passport",
  dl: "Driving licence",
  voter: "Voter ID",
  other: "Other ID",
};

export const GENDER_LABELS: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  prefer_not: "Prefer not to say",
};

export const DIGIYATRA_LABELS: Record<DigiYatraStatus, string> = {
  not_started: "Not started (guest note)",
  enrolled: "Enrolled (guest note only)",
  shared: "Shared with BBI (guest note only)",
};
