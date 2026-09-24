/** Guest / traveller profile collected before payment. */

export type IdType = "aadhaar" | "passport" | "dl" | "voter" | "other";
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
};

export const TRAVELERS_KEY = "tripweave-travelers";

export function emptyTraveler(overrides: Partial<Traveler> = {}): Traveler {
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
    ...overrides,
  };
}

function normalizeTraveler(raw: unknown): Traveler | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Traveler> & Record<string, unknown>;
  return emptyTraveler({
    fullName: typeof t.fullName === "string" ? t.fullName : "",
    phone: typeof t.phone === "string" ? t.phone : "",
    email: typeof t.email === "string" ? t.email : "",
    dateOfBirth: typeof t.dateOfBirth === "string" ? t.dateOfBirth : "",
    gender: (t.gender as Gender) || "prefer_not",
    nationality: typeof t.nationality === "string" ? t.nationality : "IN",
    idType: (t.idType as IdType) || "aadhaar",
    idNumber: maskStoredId(
      (t.idType as IdType) || "aadhaar",
      typeof t.idNumber === "string" ? t.idNumber : "",
    ),
    specialRequests: typeof t.specialRequests === "string" ? t.specialRequests : "",
    emergencyName: typeof t.emergencyName === "string" ? t.emergencyName : "",
    emergencyPhone: typeof t.emergencyPhone === "string" ? t.emergencyPhone : "",
    identitySource: (t.identitySource as IdentitySource) || "manual",
    issuedDocs: Array.isArray(t.issuedDocs) ? (t.issuedDocs as IssuedDoc[]) : [],
    digiYatra: (t.digiYatra as DigiYatraStatus) || "not_started",
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
    return parsed.map(normalizeTraveler).filter((t): t is Traveler => t !== null);
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

export function validateTraveler(t: Traveler): TravelerErrors {
  const e: TravelerErrors = {};
  if (t.fullName.trim().length < 2) e.fullName = "Enter the name as on the ID.";
  const phone = t.phone.replace(/\D/g, "").slice(-10);
  if (!PHONE_RE.test(phone)) e.phone = "Use a 10-digit Indian mobile number.";
  if (!EMAIL_RE.test(t.email.trim())) e.email = "Enter a valid email.";
  if (!t.dateOfBirth) e.dateOfBirth = "Date of birth is required.";
  else {
    const dob = new Date(`${t.dateOfBirth}T12:00:00`);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (Number.isNaN(dob.getTime()) || age < 0 || age > 120) {
      e.dateOfBirth = "Check the date of birth.";
    }
  }
  if (!t.nationality.trim()) e.nationality = "Nationality is required.";
  const id = t.idNumber.replace(/\s/g, "").replace(/-/g, "");
  if (t.idType === "aadhaar") {
    if (!/^\d{12}$/.test(id) && !/^\d{4}$/.test(id) && !/^x{8}\d{4}$/i.test(id)) {
      e.idNumber = "Enter 12-digit Aadhaar or last 4 digits.";
    }
  } else if (t.idType === "passport") {
    if (id.length < 6 && id.length !== 4) e.idNumber = "Enter passport number.";
  } else if (!id) {
    e.idNumber = "ID number is required.";
  }
  if (t.emergencyPhone) {
    const ep = t.emergencyPhone.replace(/\D/g, "").slice(-10);
    if (ep && !PHONE_RE.test(ep)) e.emergencyPhone = "Use a 10-digit mobile.";
  }
  return e;
}

export function validateTravelers(list: Traveler[]): {
  ok: boolean;
  errors: TravelerErrors[];
} {
  if (list.length < 1) return { ok: false, errors: [{}] };
  const errors = list.map((t) => validateTraveler(t));
  const ok = errors.every((e) => Object.keys(e).length === 0);
  return { ok, errors };
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
  not_started: "Not started",
  enrolled: "Enrolled",
  shared: "Shared with BBI",
};
