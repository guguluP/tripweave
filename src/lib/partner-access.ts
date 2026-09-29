import { HOTEL_DESKS } from "./hotel-desk.ts";

/**
 * Hotel desk emails, plus PARTNER_EMAILS (email:packageId only).
 * The email:* wildcard is refused — use TW_DESK_TOKENS for multi-property desk access.
 */
/** A PARTNER_EMAILS entry with no package id, or with "*", would grant every hotel. */
export function isBannedPartnerWildcard(entry: string): boolean {
  const idx = entry.indexOf(":");
  if (idx === -1) return true;
  const stay = entry.slice(idx + 1).trim();
  return !stay || stay === "*";
}

export function packageIdsForPartner(email: string): string[] {
  const normalized = email.trim().toLowerCase();
  const fromDesks = Object.values(HOTEL_DESKS)
    .filter((desk) => desk.email.toLowerCase() === normalized)
    .map((desk) => desk.packageId);
  const extra = (process.env.PARTNER_EMAILS ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const granted: string[] = [];
  for (const entry of extra) {
    const [addr, stay] = entry.split(":").map((bit) => bit.trim());
    if (addr.toLowerCase() !== normalized) continue;
    if (isBannedPartnerWildcard(entry)) {
      console.warn(
        "[partner] refused PARTNER_EMAILS wildcard for",
        normalized,
        "— set an explicit packageId or use TW_DESK_TOKENS",
      );
      continue;
    }
    granted.push(stay);
  }
  return [...new Set([...fromDesks, ...granted])];
}
