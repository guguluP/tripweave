import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isBannedPartnerWildcard, packageIdsForPartner } from "@/lib/partner-access";

export { isBannedPartnerWildcard, packageIdsForPartner };

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
