import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { HOTEL_DESKS } from "@/lib/hotel-desk";

/** Hotel desk emails, plus PARTNER_EMAILS (email or email:packageId). */
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
    if (!stay || stay === "*") return Object.keys(HOTEL_DESKS);
    granted.push(stay);
  }
  return [...new Set([...fromDesks, ...granted])];
}

export const partnerStays = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<string[]> => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = await getSessionUser();
    if (!user?.email) return [];
    return packageIdsForPartner(user.email);
  });

export async function assertPartnerStay(packageId: string) {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  const allowed = user?.email ? packageIdsForPartner(user.email) : [];
  if (!allowed.includes(packageId)) {
    throw new Error("Only the hotel desk for this stay can do that.");
  }
}
