import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { ALPHA3_TO_ALPHA2, COUNTRY_CODES } from "./countries.data.ts";

export { ALPHA3_TO_ALPHA2, COUNTRY_CODES };

const CODE_SET = new Set<string>(COUNTRY_CODES);

export function isCountryCode(code: string): boolean {
  return CODE_SET.has((code || "").trim().toUpperCase());
}

export function countryName(code: string, locale = "en"): string {
  const upper = (code || "").trim().toUpperCase();
  if (!upper) return code;
  try {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return names.of(upper) || upper;
  } catch {
    return upper;
  }
}

const optionCache = new Map<string, { code: string; name: string }[]>();

/** India first, then the rest sorted by localised name. */
export function countryOptions(locale = "en"): { code: string; name: string }[] {
  const hit = optionCache.get(locale);
  if (hit) return hit;
  const rest = COUNTRY_CODES.filter((code) => code !== "IN").map((code) => ({
    code,
    name: countryName(code, locale),
  }));
  rest.sort((a, b) => a.name.localeCompare(b.name, locale));
  const list = [{ code: "IN", name: countryName("IN", locale) }, ...rest];
  optionCache.set(locale, list);
  return list;
}

/** Calling code without a plus. Null when libphonenumber has no metadata (AQ, BV, HM, …). */
export function callingCode(code: string): string | null {
  try {
    return getCountryCallingCode((code || "").trim().toUpperCase() as CountryCode);
  } catch {
    return null;
  }
}
