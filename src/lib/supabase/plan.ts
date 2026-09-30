import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSupabaseAdmin } from "./server";
import { SUPABASE_WRITE_GATE } from "./write-gate";

const documentSchema = z.object({
  brief: z.record(z.string(), z.unknown()),
  pending: z.record(z.string(), z.unknown()).nullable().optional(),
  updatedAt: z.string().min(10).max(40),
});

async function guestPlan(op: string, payload: Record<string, unknown>) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase is not configured");
  const { data, error } = await sb.rpc("tw_guest_plan", {
    p_gate: SUPABASE_WRITE_GATE,
    p_op: op,
    p_payload: payload,
  });
  if (error) throw new Error(error.message);
  return data;
}

export const loadGuestPlan = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const data = await guestPlan("load_plan", { user_id: context.userId });
    if (!data || typeof data !== "object") return null;
    const row = data as { document?: unknown; updatedAt?: string };
    if (!row.document || typeof row.document !== "object") return null;
    return { document: row.document as Record<string, unknown>, updatedAt: String(row.updatedAt ?? "") };
  });

export const saveGuestPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => documentSchema.parse(data))
  .handler(async ({ context, data }) => {
    const result = await guestPlan("save_plan", {
      user_id: context.userId,
      updated_at: data.updatedAt,
      document: { brief: data.brief, pending: data.pending ?? null },
    });
    return result as { ok?: boolean; stale?: boolean; document?: Record<string, unknown>; updatedAt?: string } | null;
  });
