import { HOTEL_DESKS } from "@/lib/hotel-desk";

/**
 * Hotel desk emails, plus PARTNER_EMAILS (email:packageId only).
 * The email:* wildcard is refused — use TW_DESK_TOKENS for multi-property desk access.
 */
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
    if (!stay || stay === "*") {
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
