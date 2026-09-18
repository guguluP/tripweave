import { getSupabaseAdmin } from "./server";
import { SUPABASE_WRITE_GATE } from "./write-gate";

export async function twApply<T = unknown>(
  op: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase is not configured");
  const { data, error } = await sb.rpc("tw_apply", {
    p_gate: SUPABASE_WRITE_GATE,
    p_op: op,
    p_payload: payload,
  });
  if (error) {
    console.error("[supabase] tw_apply", op, error.message);
    throw new Error(error.message);
  }
  return data as T;
}
