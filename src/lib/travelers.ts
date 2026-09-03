/** Guest / traveller profile collected before payment. */

export type IdType = "aadhaar" | "passport" | "dl" | "voter" | "other";
export type Gender = "female" | "male" | "other" | "prefer_not";

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
  /** How identity was filled: manual | digilocker_demo | digilocker. */
  identitySource: "manual" | "digilocker_demo" | "digilocker";
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
    ...overrides,
  };
}

export function saveTravelers(list: Traveler[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRAVELERS_KEY, JSON.stringify(list));
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
    return parsed as Traveler[];
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

export function validateTraveler(t: Traveler, index: number): TravelerErrors {
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
  const id = t.idNumber.replace(/\s/g, "");
  if (t.idType === "aadhaar") {
    if (!/^\d{12}$/.test(id) && !/^\d{4}$/.test(id) && !/x{8}\d{4}/i.test(id)) {
      e.idNumber = "Enter 12-digit Aadhaar or last 4 digits.";
    }
  } else if (t.idType === "passport") {
    if (id.length < 6) e.idNumber = "Enter passport number.";
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
  const errors = list.map((t, i) => validateTraveler(t, i));
  const ok = errors.every((e) => Object.keys(e).length === 0);
  return { ok, errors };
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

/** Demo DigiLocker-style payload (no live API — needs DigiLocker partner credentials). */
export function digilockerDemoTraveler(): Traveler {
  return emptyTraveler({
    fullName: "Priya Sharma",
    phone: "9876543210",
    email: "priya.sharma@example.com",
    dateOfBirth: "1994-06-15",
    gender: "female",
    nationality: "IN",
    idType: "aadhaar",
    idNumber: "XXXX-XXXX-4321",
    identitySource: "digilocker_demo",
  });
}
