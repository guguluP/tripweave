import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Map this login back to the user id that already owns the account's trips. */
export async function claimStableUserId(
  sessionUserId: string,
  email: string | null | undefined,
): Promise<string> {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) return sessionUserId;
  const sb = getSupabaseAdmin();
  if (!sb) return sessionUserId;
  const { data, error } = await sb.rpc("tw_claim_subject", {
    p_email: normalized,
    p_session_user_id: sessionUserId,
  });
  if (error) {
    console.error("[auth] claim subject", error.message);
    return sessionUserId;
  }
  return typeof data === "string" && data.length > 0 ? data : sessionUserId;
}
