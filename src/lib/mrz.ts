import { parse, type ParseResult } from "mrz";
import { ALPHA3_TO_ALPHA2, isCountryCode } from "./countries.ts";
import { idLast4, type IdType } from "./travelers.ts";

/**
 * ICAO codes that are not ISO 3166-1 alpha-3.
 * D is Germany. XX* is stateless and is not mapped.
 */
const ICAO_NATIONALITY: Record<string, string> = {
  D: "DE",
  GBD: "GB",
  GBN: "GB",
  GBO: "GB",
  GBP: "GB",
  GBS: "GB",
};

export type MrzFill = {
  fullName: string;
  nationality?: string;
  idType: IdType;
  /** Last 4 only. Empty when the document-number check digit fails. */
  idNumber: string;
  warnings: string[];
  /** Shown to the guest. Never stored. */
  expiryWarning?: string;
  checkDigitsOk: boolean;
};

export function icaoNationality(code: string | null | undefined): string | null {
  const raw = (code || "").replace(/</g, "").trim().toUpperCase();
  if (!raw || raw.startsWith("XX")) return null;
  const mapped = ICAO_NATIONALITY[raw] || ALPHA3_TO_ALPHA2[raw];
  if (!mapped || !isCountryCode(mapped)) return null;
  return mapped;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function mrzDate(yymmdd: string | null | undefined): Date | null {
  if (!yymmdd || !/^\d{6}$/.test(yymmdd)) return null;
  const yy = Number(yymmdd.slice(0, 2));
  const month = Number(yymmdd.slice(2, 4));
  const day = Number(yymmdd.slice(4, 6));
  const year = yy >= 70 ? 1900 + yy : 2000 + yy;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function expiresSoon(expiry: Date, arrivalIso?: string): boolean {
  const arrival = arrivalIso ? new Date(`${arrivalIso}T00:00:00Z`) : new Date();
  if (Number.isNaN(arrival.getTime())) return false;
  const limit = new Date(arrival.getTime());
  limit.setUTCMonth(limit.getUTCMonth() + 6);
  return expiry.getTime() < limit.getTime();
}

function documentCheckFailed(result: ParseResult): boolean {
  const digit = result.details.find((detail) => detail.field === "documentNumberCheckDigit");
  return Boolean(digit && digit.valid === false);
}

/** Map a parsed MRZ to guest fields. The document number is reduced to the last 4 before return. */
export function mrzToTraveler(lines: string[], opts?: { arrivalDate?: string }): MrzFill | null {
  let result: ParseResult;
  try {
    result = parse(lines, { autocorrect: true });
  } catch {
    return null;
  }
  const fields = result.fields;
  const lastName = typeof fields.lastName === "string" ? fields.lastName : "";
  const firstName = typeof fields.firstName === "string" ? fields.firstName : "";
  const fullName = titleCase(`${lastName} ${firstName}`);
  if (!fullName) return null;

  const warnings: string[] = [];
  let idNumber = "";
  const checkFailed = documentCheckFailed(result);
  if (checkFailed) {
    warnings.push("Check digit did not match. The document number was not kept.");
  } else if (typeof fields.documentNumber === "string" && fields.documentNumber) {
    idNumber = idLast4(fields.documentNumber);
  }

  const nationality = icaoNationality(typeof fields.nationality === "string" ? fields.nationality : null) ?? undefined;
  const expiry = mrzDate(typeof fields.expirationDate === "string" ? fields.expirationDate : null);
  const expiryWarning = expiry && expiresSoon(expiry, opts?.arrivalDate)
    ? "Passport expires within 6 months of arrival"
    : undefined;

  return {
    fullName,
    nationality,
    idType: "passport",
    idNumber,
    warnings,
    expiryWarning,
    checkDigitsOk: !checkFailed,
  };
}

/** Best-effort TD3 lines from OCR text. Nothing here is sent to a server. */
export function pickMrzLines(raw: string): string[] | null {
  const rows = raw
    .toUpperCase()
    .split(/\r?\n/)
    .map((line) => line.replace(/[^A-Z0-9<]/g, ""))
    .filter((line) => line.length >= 40 && line.length <= 44)
    .map((line) => line.padEnd(44, "<").slice(0, 44));
  if (rows.length >= 2) {
    const start = rows.findIndex((line) => line.startsWith("P<"));
    if (start >= 0 && rows[start + 1]) return [rows[start]!, rows[start + 1]!];
    return [rows[0]!, rows[1]!];
  }
  const blob = raw.toUpperCase().replace(/[^A-Z0-9<]/g, "");
  const at = blob.indexOf("P<");
  if (at >= 0 && blob.length >= at + 88) {
    return [blob.slice(at, at + 44), blob.slice(at + 44, at + 88)];
  }
  return null;
}
