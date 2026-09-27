/**
 * Link a verified sign-in email to one profiles row (stable user id).
 * Session ids stay disposable; bookings hang off the claimed subject.
 * Additive — never deletes bookings.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ProfileLinkResult = {
  userId: string;
  email: string;
  linked: boolean;
};

/**
 * After tw_claim_subject, ensure profiles has one row for the canon user id
 * with the verified email. Safe no-op without Supabase.
 */
export async function linkVerifiedEmailProfile(
  stableUserId: string,
  email: string | null | undefined,
  displayName?: string | null,
): Promise<ProfileLinkResult> {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized || !stableUserId) {
    return { userId: stableUserId, email: normalized, linked: false };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return { userId: stableUserId, email: normalized, linked: false };

  const { error } = await sb.rpc("tw_link_profile_email", {
    p_user_id: stableUserId,
    p_email: normalized,
    p_display_name: displayName?.trim() || null,
  });
  if (error) {
    // Fallback: direct upsert when migration not applied yet.
    const { error: upErr } = await sb.from("profiles").upsert(
      {
        user_id: stableUserId,
        email: normalized,
        display_name: displayName?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (upErr) {
      console.warn("[auth] profile link", upErr.message);
      return { userId: stableUserId, email: normalized, linked: false };
    }
  }
  return { userId: stableUserId, email: normalized, linked: true };
}
