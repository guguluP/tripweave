import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ARRIVAL_PURPOSES, guestExpiresAt } from "@/lib/travelers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
import { shouldSkipNeon } from "./db-fallback";

const rowSchema = z.object({
  guestIndex: z.number().int().min(0).max(11),
  arrivedFrom: z.string().max(120).optional().default(""),
  arrivalTime: z.string().max(40).optional().default(""),
  purpose: z.union([z.enum(ARRIVAL_PURPOSES), z.literal("")]).optional().default(""),
  previousStay: z.string().max(160).optional().default(""),
  nextDestination: z.string().max(160).optional().default(""),
});

const saveSchema = z.object({
  bookingId: z.number().int().positive(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().min(1).max(30),
  rows: z.array(rowSchema).max(12),
});

export type ForeignGuestRow = {
  fullName: string;
  nationality: string;
  idType: string;
  idLast4: string;
  phone: string;
  email: string;
  checkIn: string;
  nights: number;
  arrivedFrom: string;
  arrivalTime: string;
  purpose: string;
  previousStay: string;
  nextDestination: string;
  confirmationCode: string;
};

const memoryArrivals = new Map<string, Record<string, unknown>>();

function memoryKey(userId: string, bookingId: number, guestIndex: number) {
  return `${userId}:${bookingId}:${guestIndex}`;
}

async function callArrivals(op: string, payload: Record<string, unknown>): Promise<unknown> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb.rpc("tw_guest_arrivals", {
        p_gate: SUPABASE_WRITE_GATE,
        p_op: op,
        p_payload: payload,
      });
      if (error) throw new Error(error.message);
      return data;
    }
  }
  if (!shouldSkipNeon()) {
    const sql = await getSql();
    const rows = await sql<{ result: unknown }>`select tw_guest_arrivals(${op}, ${JSON.stringify(payload)}::jsonb) as result`;
    const value = rows[0]?.result;
    return typeof value === "string" ? JSON.parse(value) : value;
  }
  return null;
}

export const saveGuestArrivals = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const payload = {
      user_id: context.userId,
      booking_id: data.bookingId,
      expires_at: guestExpiresAt(data.checkIn, data.nights),
      rows: data.rows.map((row) => ({
        guest_index: row.guestIndex,
        arrived_from: row.arrivedFrom,
        arrival_time: row.arrivalTime,
        purpose: row.purpose,
        previous_stay: row.previousStay,
        next_destination: row.nextDestination,
      })),
    };
    try {
      const saved = await callArrivals("save", payload);
      if (saved == null) {
        for (const row of payload.rows) {
          memoryArrivals.set(memoryKey(context.userId, data.bookingId, row.guest_index), {
            ...row,
            userId: context.userId,
            bookingId: data.bookingId,
            expiresAt: payload.expires_at,
          });
        }
      }
      return { ok: true as const };
    } catch (err) {
      console.error("[guest-arrivals]", err instanceof Error ? err.message : "save");
      return { ok: false as const, message: "Arrival details were not saved. The stay is still booked." };
    }
  });

function mapForeign(row: Record<string, unknown>): ForeignGuestRow {
  return {
    fullName: String(row.fullName ?? row.full_name ?? ""),
    nationality: String(row.nationality ?? ""),
    idType: String(row.idType ?? row.id_type ?? ""),
    idLast4: String(row.idLast4 ?? row.id_last4 ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    checkIn: String(row.checkIn ?? row.check_in ?? "").slice(0, 10),
    nights: Number(row.nights ?? 0),
    arrivedFrom: String(row.arrivedFrom ?? row.arrived_from ?? ""),
    arrivalTime: String(row.arrivalTime ?? row.arrival_time ?? ""),
    purpose: String(row.purpose ?? ""),
    previousStay: String(row.previousStay ?? row.previous_stay ?? ""),
    nextDestination: String(row.nextDestination ?? row.next_destination ?? ""),
    confirmationCode: String(row.confirmationCode ?? row.confirmation_code ?? ""),
  };
}

export async function loadForeignRegister(packageId: string): Promise<ForeignGuestRow[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb.rpc("tw_desk_foreign_register", {
        p_gate: SUPABASE_WRITE_GATE,
        p_package: packageId,
      });
      if (!error && Array.isArray(data)) return data.map((row) => mapForeign(row as Record<string, unknown>));
      if (error) console.error("[guest-arrivals] register", error.message);
      return [];
    }
  }
  if (!shouldSkipNeon()) {
    try {
      const sql = await getSql();
      const rows = await sql<{ result: unknown }>`select tw_desk_foreign_register(${packageId}) as result`;
      const value = rows[0]?.result;
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (Array.isArray(parsed)) return parsed.map((row) => mapForeign(row as Record<string, unknown>));
    } catch (err) {
      console.error("[guest-arrivals] register", err instanceof Error ? err.message : "db");
    }
  }
  return [];
}
