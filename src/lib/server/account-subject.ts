import { getSupabaseAdmin } from "@/lib/supabase/server";

export class ClaimSubjectError extends Error {
  constructor(
    message = "Could not link this sign-in to your trips. Try again in a moment.",
  ) {
    super(message);
    this.name = "ClaimSubjectError";
  }
}

/** Map this login back to the user id that already owns the account's trips. */
export async function claimStableUserId(
  sessionUserId: string,
  email: string | null | undefined,
): Promise<string> {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) return sessionUserId;
  const sb = getSupabaseAdmin();
  if (!sb) return sessionUserId;

  let lastMessage = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await sb.rpc("tw_claim_subject", {
      p_email: normalized,
      p_session_user_id: sessionUserId,
    });
    if (!error) {
      return typeof data === "string" && data.length > 0 ? data : sessionUserId;
    }
    lastMessage = error.message || "tw_claim_subject failed";
    console.error("[auth] claim subject", lastMessage, attempt === 0 ? "(retrying)" : "(giving up)");
  }
  throw new ClaimSubjectError(
    "Could not link this sign-in to your trips. Refresh My trips or try again in a moment.",
  );
}
