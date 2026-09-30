/**
 * Desk portal server functions: allotment, stop-sell, transitions.
 * Auth: per-property TW_DESK_TOKENS (preferred) or signed-in partner email (no email:*).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
import { assertPartnerStay } from "@/lib/server/partner";
import { packageIdsForPartner } from "@/lib/partner-access";
import { assertDeskTokenForPackage, packageIdsForDeskToken, verifyDeskAction } from "@/lib/server/desk-auth";
import {
  listAllotment,
  listStopSell,
  setNightUnits,
  setStopSell,
  type NightAllotment,
  type StopSellRow,
} from "@/lib/allotment-store";
import { todayIso } from "@/lib/inventory";
import { getSql } from "@/lib/db";
import { isDurableDbError, markDurableDbFailed, shouldSkipNeon } from "@/lib/server/db-fallback";

export type DeskOpsBooking = {
  id: number;
  packageId: string;
  packageName: string;
  checkIn: string;
  nights: number;
  travelers: number;
  payerName: string;
  status: string;
  confirmationCode: string;
  amountInr: number;
  guestEmail?: string | null;
  opsFlaggedAt?: string | null;
};

async function assertDeskAccess(packageId: string, deskToken?: string) {
  if (deskToken && assertDeskTokenForPackage(deskToken, packageId)) return { via: "token" as const };
  try {
    await assertPartnerStay(packageId);
    return { via: "email" as const };
  } catch {
    throw new Error("Desk access denied for this property.");
  }
}

const rangeSchema = z.object({
  packageId: z.string().min(1).max(80),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deskToken: z.string().max(200).optional(),
});

export const deskResolvePackages = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ deskToken: z.string().max(200).optional() }).parse(data))
  .handler(async ({ data }): Promise<string[]> => {
    if (data.deskToken) return packageIdsForDeskToken(data.deskToken);
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = await getSessionUser();
    if (!user?.email) return [];
    return packageIdsForPartner(user.email);
  });

export const deskListBookings = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ packageId: z.string().min(1).max(80), deskToken: z.string().max(200).optional() }).parse(data),
  )
  .handler(async ({ data }): Promise<DeskOpsBooking[]> => {
    await assertDeskAccess(data.packageId, data.deskToken);
    if (isSupabaseConfigured()) {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: rows, error } = await sb.rpc("tw_desk_bookings", {
          p_gate: SUPABASE_WRITE_GATE,
          p_package: data.packageId,
        });
        if (!error && Array.isArray(rows)) return rows as DeskOpsBooking[];
      }
    }
    return [];
  });

export const deskListAllotment = createServerFn({ method: "POST" })
  .validator((data: unknown) => rangeSchema.parse(data))
  .handler(async ({ data }): Promise<NightAllotment[]> => {
    await assertDeskAccess(data.packageId, data.deskToken);
    if (isSupabaseConfigured()) {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: rows, error } = await sb.rpc("tw_list_allotment", {
          p_gate: SUPABASE_WRITE_GATE,
          p_payload: { package_id: data.packageId, from: data.from, to: data.to },
        });
        if (!error && Array.isArray(rows)) return rows as NightAllotment[];
      }
    }
    return listAllotment().filter(
      (r) => r.packageId === data.packageId && r.night >= data.from && r.night <= data.to,
    );
  });

export const deskListStopSell = createServerFn({ method: "POST" })
  .validator((data: unknown) => rangeSchema.parse(data))
  .handler(async ({ data }): Promise<StopSellRow[]> => {
    await assertDeskAccess(data.packageId, data.deskToken);
    if (isSupabaseConfigured()) {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: rows, error } = await sb.rpc("tw_list_stop_sell", {
          p_gate: SUPABASE_WRITE_GATE,
          p_payload: { package_id: data.packageId, from: data.from, to: data.to },
        });
        if (!error && Array.isArray(rows)) return rows as StopSellRow[];
      }
    }
    return listStopSell().filter(
      (r) => r.packageId === data.packageId && r.night >= data.from && r.night <= data.to,
    );
  });

const allotmentSchema = z.object({
  packageId: z.string().min(1).max(80),
  roomId: z.string().min(1).max(80),
  night: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  units: z.number().int().min(0).max(200),
  deskToken: z.string().max(200).optional(),
});

export const deskSetAllotment = createServerFn({ method: "POST" })
  .validator((data: unknown) => allotmentSchema.parse(data))
  .handler(async ({ data }) => {
    await assertDeskAccess(data.packageId, data.deskToken);
    if (data.night < todayIso()) return { ok: false as const, message: "That night has already passed." };
    const payload = {
      package_id: data.packageId,
      room_id: data.roomId,
      night: data.night,
      units: data.units,
      updated_by: "desk",
    };
    if (isSupabaseConfigured()) {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { error } = await sb.rpc("tw_set_allotment", {
          p_gate: SUPABASE_WRITE_GATE,
          p_payload: payload,
        });
        if (error) return { ok: false as const, message: error.message };
      }
    } else if (!shouldSkipNeon()) {
      try {
        const sql = await getSql();
        await sql`select tw_set_allotment(${JSON.stringify(payload)}::jsonb)`;
      } catch (err) {
        if (isDurableDbError(err)) markDurableDbFailed(err);
        // fall through to memory
      }
    }
    setNightUnits({
      packageId: data.packageId,
      roomId: data.roomId,
      night: data.night,
      units: data.units,
    });
    return { ok: true as const };
  });

const stopSellSchema = z.object({
  packageId: z.string().min(1).max(80),
  roomId: z.string().max(80).optional(),
  night: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closed: z.boolean(),
  reason: z.string().max(200).optional(),
  deskToken: z.string().max(200).optional(),
});

export const deskSetStopSell = createServerFn({ method: "POST" })
  .validator((data: unknown) => stopSellSchema.parse(data))
  .handler(async ({ data }) => {
    await assertDeskAccess(data.packageId, data.deskToken);
    if (data.night < todayIso()) return { ok: false as const, message: "That night has already passed." };
    const payload = {
      package_id: data.packageId,
      room_id: data.roomId ?? "",
      night: data.night,
      closed: data.closed,
      reason: data.reason ?? "",
      updated_by: "desk",
    };
    if (isSupabaseConfigured()) {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { error } = await sb.rpc("tw_set_stop_sell", {
          p_gate: SUPABASE_WRITE_GATE,
          p_payload: payload,
        });
        if (error) return { ok: false as const, message: error.message };
      }
    } else if (!shouldSkipNeon()) {
      try {
        const sql = await getSql();
        await sql`select tw_set_stop_sell(${JSON.stringify(payload)}::jsonb)`;
      } catch (err) {
        if (isDurableDbError(err)) markDurableDbFailed(err);
      }
    }
    setStopSell(
      {
        packageId: data.packageId,
        roomId: data.roomId ?? "",
        night: data.night,
        reason: data.reason,
      },
      data.closed,
    );
    return { ok: true as const };
  });

const transitionSchema = z.object({
  id: z.number().int().positive(),
  packageId: z.string().min(1).max(80),
  action: z.enum(["desk_confirm", "desk_decline", "check_in"]),
  note: z.string().max(400).optional(),
  deskToken: z.string().max(200).optional(),
});

/** Used when tw_desk_transition was never created. Statuses stay inside the live bookings check. */
export async function transitionBookingRow(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: {
    id: number;
    packageId: string;
    action: "desk_confirm" | "desk_decline" | "check_in";
    note?: string;
    refundId?: string | null;
    refundAmount?: number;
  },
) {
  const { data: row, error: readError } = await sb
    .from("bookings")
    .select("id,status,swaps")
    .eq("id", input.id)
    .eq("package_id", input.packageId)
    .maybeSingle();
  if (readError) return { ok: false as const, message: readError.message };
  if (!row) return { ok: false as const, message: "That stay was not found." };
  const status = String(row.status);
  let next = "";
  if (input.action === "desk_confirm") {
    if (status !== "paid") return { ok: false as const, message: "That stay is not waiting for this action." };
    next = "confirmed";
  } else if (input.action === "desk_decline") {
    if (status !== "paid") return { ok: false as const, message: "That stay is not waiting for this action." };
    next = input.refundId ? "refunded" : "cancelled";
  } else if (status !== "desk_confirmed" && status !== "confirmed") {
    return { ok: false as const, message: "That stay is not waiting for this action." };
  } else {
    next = "completed";
  }
  const swaps =
    row.swaps && typeof row.swaps === "object" && !Array.isArray(row.swaps)
      ? (row.swaps as Record<string, unknown>)
      : {};
  const { error } = await sb
    .from("bookings")
    .update({
      status: next,
      swaps: {
        ...swaps,
        deskNote: input.note ?? "",
        deskAction: input.action,
        deskAt: new Date().toISOString(),
        ...(input.refundId ? { refundId: input.refundId, refundAmount: input.refundAmount ?? 0, refundedAt: new Date().toISOString() } : {}),
      },
    })
    .eq("id", input.id)
    .eq("package_id", input.packageId);
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, status: next };
}

/** Hotel declined the stay: send the full amount back before the row is closed. */
async function refundDeskCancellation(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  input: { id: number; packageId: string },
) {
  const { data: row, error } = await sb
    .from("bookings")
    .select("id,status,amount_inr,payment_ref,payment_method,user_id")
    .eq("id", input.id)
    .eq("package_id", input.packageId)
    .maybeSingle();
  if (error) return { ok: false as const, message: error.message };
  if (!row) return { ok: false as const, message: "That stay was not found." };
  if (String(row.status) !== "paid") return { ok: false as const, message: "That stay is not waiting for this action." };
  const amountInr = Number(row.amount_inr) || 0;
  const ref = String(row.payment_ref ?? "");
  const method = String(row.payment_method ?? "");
  if (method !== "razorpay" || !ref.startsWith("pay_") || amountInr <= 0) {
    return { ok: true as const, refundId: null, amountInr: 0 };
  }
  const { fetchRazorpayPayment, refundRazorpayPayment } = await import("@/lib/server/razorpay");
  const payment = await fetchRazorpayPayment(ref);
  const already = (payment?.amountRefundedPaise ?? 0) >= Math.round(amountInr * 100);
  let refundId = already ? "already_refunded" : "";
  if (!already) {
    const refunded = await refundRazorpayPayment(ref, amountInr);
    if (!refunded.ok) return { ok: false as const, message: refunded.message };
    refundId = refunded.refundId;
  }
  const userId = String(row.user_id ?? "");
  if (userId) {
    const { persistRefundIntent } = await import("@/lib/server/payment-ops");
    await persistRefundIntent({
      id: `refund_${userId}_${input.id}`,
      userId,
      bookingId: input.id,
      paymentRef: ref,
      amountInr,
      status: "gateway_done",
      refundId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return { ok: true as const, refundId, amountInr };
}

async function runTransition(input: {
  id: number;
  packageId: string;
  action: "desk_confirm" | "desk_decline" | "check_in";
  note?: string;
}) {
  const payload = {
    id: input.id,
    package_id: input.packageId,
    action: input.action,
    note: input.note ?? "",
  };
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false as const, message: "Database not connected." };
    let refundId: string | null = null;
    let refundAmount = 0;
    if (input.action === "desk_decline") {
      const refund = await refundDeskCancellation(sb, input);
      if (!refund.ok) return refund;
      refundId = refund.refundId;
      refundAmount = refund.amountInr;
    }
    const declined = (status?: string) => {
      if (!refundId) return { ok: true as const, status: status ?? "cancelled" };
      return {
        ok: true as const,
        status: "refunded",
        message: `Declined. ₹${refundAmount.toLocaleString("en-IN")} will return to the original payment.`,
      };
    };
    const { data: result, error } = await sb.rpc("tw_desk_transition", {
      p_gate: SUPABASE_WRITE_GATE,
      p_payload: payload,
    });
    if (!error) {
      if (refundId) {
        await sb
          .from("bookings")
          .update({ status: "refunded" })
          .eq("id", input.id)
          .eq("package_id", input.packageId);
      }
      return declined((result as { status?: string })?.status);
    }
    if (!/schema cache|could not find the function|PGRST202/i.test(error.message)) {
      const msg = error.message.includes("not_open")
        ? "That stay is not waiting for this action."
        : error.message;
      return { ok: false as const, message: refundId ? `${msg} The payment was already sent back.` : msg };
    }
    const saved = await transitionBookingRow(sb, { ...input, refundId, refundAmount });
    if (!saved.ok) return saved;
    return declined(saved.status);
  }
  if (!shouldSkipNeon()) {
    try {
      const sql = await getSql();
      const rows = await sql`select tw_desk_transition(${JSON.stringify(payload)}::jsonb) as result`;
      const result = rows[0]?.result as { status?: string } | undefined;
      return { ok: true as const, status: result?.status };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isDurableDbError(err)) markDurableDbFailed(err);
      return { ok: false as const, message };
    }
  }
  return { ok: false as const, message: "Desk transition needs the database." };
}

export const deskTransitionBooking = createServerFn({ method: "POST" })
  .validator((data: unknown) => transitionSchema.parse(data))
  .handler(async ({ data }) => {
    await assertDeskAccess(data.packageId, data.deskToken);
    return runTransition(data);
  });

export const deskApplyActionToken = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ token: z.string().min(10).max(2000) }).parse(data))
  .handler(async ({ data }) => {
    const payload = verifyDeskAction(data.token);
    if (!payload) return { ok: false as const, message: "Link expired or invalid." };
    const action = payload.action === "accept" ? "desk_confirm" : "desk_decline";
    return runTransition({
      id: payload.bookingId,
      packageId: payload.packageId,
      action,
      note: payload.action === "accept" ? "Confirmed via email link" : "Declined via email link",
    });
  });
