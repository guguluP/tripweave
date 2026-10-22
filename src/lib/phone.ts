import { isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/** Indian mobile numbers. Kept strict for +91. */
export const IN_MOBILE_RE = /^[6-9]\d{9}$/;

/**
 * Legacy 10-digit Indian mobiles become +91….
 * Anything else is parsed, with defaultCountry as the region when there is no plus.
 * Returns null when the text is not a phone number. Callers keep the raw value so the guest can fix it.
 */
export function toE164(raw: string, defaultCountry = "IN"): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!trimmed.startsWith("+") && IN_MOBILE_RE.test(digits)) return `+91${digits}`;
  const region = (defaultCountry || "IN").trim().toUpperCase();
  try {
    const parsed = parsePhoneNumberFromString(trimmed, region as CountryCode);
    return parsed?.number ?? null;
  } catch {
    return null;
  }
}

/** Valid E.164. +91 must still be a 10-digit Indian mobile. */
export function isAcceptablePhone(e164: string): boolean {
  if (!e164 || !/^\+[1-9]\d{1,14}$/.test(e164)) return false;
  if (!isValidPhoneNumber(e164)) return false;
  if (e164.startsWith("+91")) return IN_MOBILE_RE.test(e164.slice(3));
  return true;
}

export function formatPhone(e164: string): string {
  if (!e164) return "";
  try {
    const parsed = parsePhoneNumberFromString(e164);
    return parsed?.formatInternational() || e164;
  } catch {
    return e164;
  }
}
