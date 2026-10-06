import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { recordHold } from "@/lib/inventory";
import { computePayable, publicHoldId } from "@/lib/server/payable";
import { pendingHoldId, reserveCheckoutHold } from "@/lib/server/room-holds";

/** Same window as the Razorpay pending hold. Re-placing the hold extends it. */
const SOFT_HOLD_MS = 15 * 60 * 1000;

const softHoldSchema = z.object({
  packageId: z.string().min(1).max(80),
  roomId: z.string().max(40).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().min(1).max(14),
});

export type SoftHoldResult =
  | { ok: true; holdId: string; expiresAt: string }
  | { ok: false; reason: "sold_out" | "invalid" | "unavailable"; message: string };

/**
 * Soft room hold from Travellers → Pay. Uses the same hold id as createRazorpayOrder
 * (`pending:<user>:<stay>`), so the order step re-uses and extends this hold rather than
 * competing with it. Best effort: when the hold book is unreachable the guest can still
 * continue, and the order step reserves again before Razorpay opens.
 */
export const placeSoftHold = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => softHoldSchema.parse(data))
  .handler(async ({ data, context }): Promise<SoftHoldResult> => {
    const { allowRequest } = await import("@/lib/server/rate-limit");
    if (!allowRequest(`soft-hold:${context.userId}`, 20, 60_000)) {
      return { ok: false, reason: "unavailable", message: "Too many hold requests. Try again in a minute." };
    }
    const payable = await computePayable({
      packageId: data.packageId,
      roomId: data.roomId,
      checkIn: data.checkIn,
      nights: data.nights,
      travelers: 1,
      userId: context.userId,
    });
    if (!payable.ok) {
      const soldOut = /sold out/i.test(payable.message);
      return { ok: false, reason: soldOut ? "sold_out" : "invalid", message: payable.message };
    }
    const holdId = pendingHoldId({
      userId: context.userId,
      packageId: payable.packageId,
      roomId: payable.roomId,
      checkIn: payable.checkIn,
      nights: payable.nights,
    });
    const expiresAt = new Date(Date.now() + SOFT_HOLD_MS).toISOString();
    const reserved = await reserveCheckoutHold({
      holdId,
      userId: context.userId,
      packageId: payable.packageId,
      roomId: payable.roomId,
      checkIn: payable.checkIn,
      nights: payable.nights,
      units: payable.units,
      expiresAt,
    });
    if (reserved === "sold_out") {
      return { ok: false, reason: "sold_out", message: "That room just sold out for these nights. Pick another room or date." };
    }
    if (reserved !== "ok") {
      return { ok: false, reason: "unavailable", message: "Could not hold the room right now. We'll try again when you pay." };
    }
    recordHold({
      holdId,
      packageId: payable.packageId,
      roomId: payable.roomId,
      checkIn: payable.checkIn,
      nights: payable.nights,
      status: "held",
      expiresAt,
    });
    return { ok: true, holdId: publicHoldId(holdId), expiresAt };
  });
