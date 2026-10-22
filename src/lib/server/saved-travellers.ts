import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { isCountryCode } from "@/lib/countries";
import { getSql } from "@/lib/db";
import { isAcceptablePhone, toE164 } from "@/lib/phone";
import {
  isSavedPurgeDue,
  savedIdLast4,
  savedInsertAllowed,
  type SavedTraveller,
} from "@/lib/saved-travellers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
import { shouldSkipNeon } from "./db-fallback";

const idTypes = ["aadhaar", "passport", "dl", "voter", "other"] as const;

const saveSchema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().max(40).optional().default(""),
  fullName: z.string().trim().min(1).max(120),
  nationality: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .refine(isCountryCode),
  phone: z.string().max(40).optional().default(""),
  email: z.string().max(160).optional().default(""),
  idType: z.enum(idTypes).optional(),
  idLast4: z.string().max(40).optional().default(""),
});

type MemoryRow = SavedTraveller & { userId: string };

const memory = new Map<string, MemoryRow[]>();
let memorySeq = 1;

function mapRow(row: Record<string, unknown>): SavedTraveller {
  return {
    id: Number(row.id),
    label: String(row.label ?? ""),
    fullName: String(row.full_name ?? row.fullName ?? ""),
    nationality: String(row.nationality ?? "IN"),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    idType: row.id_type == null && row.idType == null ? null : String(row.id_type ?? row.idType),
    idLast4: row.id_last4 == null && row.idLast4 == null ? null : String(row.id_last4 ?? row.idLast4 ?? ""),
    lastUsedAt: String(row.last_used_at ?? row.lastUsedAt ?? new Date().toISOString()),
  };
}

function memoryCall(op: string, userId: string, payload: Record<string, unknown>): unknown {
  const now = new Date();
  const rows = (memory.get(userId) ?? []).filter((row) => !isSavedPurgeDue(row.lastUsedAt, now));
  memory.set(userId, rows);
  if (op === "list") return rows.map(({ userId: _userId, ...row }) => row);
  if (op === "delete") {
    const id = Number(payload.id);
    memory.set(
      userId,
      rows.filter((row) => row.id !== id),
    );
    return { ok: true };
  }
  if (op === "upsert") {
    const id = payload.id == null || payload.id === "" ? null : Number(payload.id);
    if (id == null && !savedInsertAllowed(rows.length)) {
      throw new Error("limit_reached");
    }
    const next: MemoryRow = {
      id: id ?? memorySeq++,
      userId,
      label: String(payload.label ?? ""),
      fullName: String(payload.full_name ?? ""),
      nationality: String(payload.nationality ?? "IN"),
      phone: String(payload.phone ?? ""),
      email: String(payload.email ?? ""),
      idType: payload.id_type == null ? null : String(payload.id_type),
      idLast4: payload.id_last4 == null ? null : savedIdLast4(String(payload.id_last4)),
      lastUsedAt: now.toISOString(),
    };
    if (id == null) rows.unshift(next);
    else {
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) rows[index] = { ...rows[index]!, ...next, id };
      else rows.unshift(next);
    }
    memory.set(userId, rows);
    return { ok: true };
  }
  throw new Error("unknown_op");
}

async function callSaved(op: string, userId: string, payload: Record<string, unknown>): Promise<unknown> {
  const body = { ...payload, user_id: userId };
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb.rpc("tw_saved_travellers", {
        p_gate: SUPABASE_WRITE_GATE,
        p_op: op,
        p_payload: body,
      });
      if (error) throw new Error(error.message);
      return data;
    }
  }
  if (!shouldSkipNeon()) {
    try {
      const sql = await getSql();
      const rows = await sql<{ result: unknown }>`select tw_saved_travellers(${op}, ${JSON.stringify(body)}::jsonb) as result`;
      const value = rows[0]?.result;
      return typeof value === "string" ? JSON.parse(value) : value;
    } catch (err) {
      console.error("[saved-travellers]", err instanceof Error ? err.message : "db");
    }
  }
  return memoryCall(op, userId, body);
}

function asList(data: unknown): SavedTraveller[] {
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => mapRow(row as Record<string, unknown>));
}

export const listSavedTravellers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      return asList(await callSaved("list", context.userId, {}));
    } catch (err) {
      console.error("[saved-travellers] list", err instanceof Error ? err.message : "failed");
      return [];
    }
  });

export const saveSavedTraveller = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const phone = data.phone.trim() ? (toE164(data.phone, data.nationality) ?? data.phone.trim()) : "";
    if (phone && !isAcceptablePhone(phone)) return { ok: false as const, message: "Enter a valid mobile number." };
    try {
      await callSaved("upsert", context.userId, {
        id: data.id,
        label: data.label,
        full_name: data.fullName,
        nationality: data.nationality,
        phone,
        email: data.email.trim(),
        id_type: data.idType ?? null,
        id_last4: data.idLast4 ? savedIdLast4(data.idLast4) : null,
      });
      return { ok: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("limit_reached")) return { ok: false as const, message: "You can save up to 20 people." };
      console.error("[saved-travellers] save", message || "failed");
      return { ok: false as const, message: "Could not save this person." };
    }
  });

export const deleteSavedTraveller = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ context, data }) => {
    try {
      await callSaved("delete", context.userId, { id: data.id });
      return { ok: true as const };
    } catch (err) {
      console.error("[saved-travellers] delete", err instanceof Error ? err.message : "failed");
      return { ok: false as const, message: "Could not delete this person." };
    }
  });
