import { rememberOwnHold } from "@/lib/inventory";
import { placeSoftHold, type SoftHoldResult } from "@/lib/server/soft-hold";

/**
 * Best-effort soft hold for the stay in the cart. Never throws: a failed call just
 * means the order step reserves the room again before Razorpay opens.
 */
export async function holdCartRoom(input: {
  packageId: string;
  roomId?: string;
  checkIn: string;
  nights: number;
}): Promise<SoftHoldResult | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkIn) || input.nights < 1) return null;
  try {
    const result = await placeSoftHold({
      data: {
        packageId: input.packageId,
        roomId: input.roomId || undefined,
        checkIn: input.checkIn,
        nights: Math.min(14, Math.max(1, Math.round(input.nights))),
      },
    });
    if (result.ok) rememberOwnHold(result.holdId);
    return result;
  } catch {
    return null;
  }
}
