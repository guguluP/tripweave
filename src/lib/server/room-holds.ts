import { getSql } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
import { isDurableDbError, markDurableDbFailed, shouldSkipNeon } from "@/lib/server/db-fallback";

export type ReserveResult = "ok" | "sold_out" | "unavailable";

type HoldInput = {
  holdId: string;
  userId: string;
  packageId: string;
  roomId: string;
  checkIn: string;
  nights: number;
  units: number;
  expiresAt: string;
};

/** Stable id for the hold taken before Razorpay returns an order id. */
export function pendingHoldId(input: {
  userId: string;
  packageId: string;
  roomId: string;
  checkIn: string;
  nights: number;
}) {
  return `pending:${input.userId}:${input.packageId}:${input.roomId}:${input.checkIn}:${input.nights}`;
}

export function holdIdsForCheckout(input: {
  userId: string;
  packageId: string;
  roomId: string;
  checkIn: string;
  nights: number;
  orderId?: string | null;
}) {
  const ids = [pendingHoldId(input)];
  if (input.orderId) ids.push(input.orderId);
  return ids;
}

function messageOf(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return err instanceof Error ? err.message : String(err);
}

function isSoldOut(message: string) {
  return /sold_out/i.test(message);
}

export async function reserveCheckoutHold(input: HoldInput): Promise<ReserveResult> {
  const payload = {
    hold_id: input.holdId,
    user_id: input.userId,
    package_id: input.packageId,
    room_id: input.roomId,
    check_in: input.checkIn,
    nights: input.nights,
    units: input.units,
    expires_at: input.expiresAt,
  };
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (!sb) return "unavailable";
    const { error } = await sb.rpc("tw_reserve_hold", {
      p_gate: SUPABASE_WRITE_GATE,
      p_payload: payload,
    });
    if (!error) return "ok";
    if (isSoldOut(error.message || "")) return "sold_out";
    console.error("[holds] reserve", error.message);
    return "unavailable";
  }
  if (shouldSkipNeon()) return "unavailable";
  try {
    const sql = await getSql();
    await sql`select tw_reserve_hold(${JSON.stringify(payload)}::jsonb)`;
    return "ok";
  } catch (err) {
    const message = messageOf(err);
    if (isSoldOut(message)) return "sold_out";
    if (isDurableDbError(err)) markDurableDbFailed(err);
    console.error("[holds] reserve", message);
    return "unavailable";
  }
}

export async function releaseCheckoutHold(input: { userId: string; holdId: string }): Promise<void> {
  if (!input.holdId) return;
  const payload = { user_id: input.userId, hold_id: input.holdId };
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (!sb) return;
    const { error } = await sb.rpc("tw_release_hold", {
      p_gate: SUPABASE_WRITE_GATE,
      p_payload: payload,
    });
    if (error) console.error("[holds] release", error.message);
    return;
  }
  if (shouldSkipNeon()) return;
  try {
    const sql = await getSql();
    await sql`select tw_release_hold(${JSON.stringify(payload)}::jsonb)`;
  } catch (err) {
    if (isDurableDbError(err)) markDurableDbFailed(err);
    console.error("[holds] release", messageOf(err));
  }
}
