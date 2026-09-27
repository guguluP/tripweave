import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
import { deskConfirmTimeoutMinutes } from "@/lib/booking-status";
import { opsAlertEmail } from "@/lib/server/cron-auth";
import { mailConfigured, sendMail } from "@/lib/mail/ses";
import { getSql } from "@/lib/db";
import { isDurableDbError, markDurableDbFailed, shouldSkipNeon } from "@/lib/server/db-fallback";

export type FlagUnconfirmedResult = {
  ok: boolean;
  flagged: number;
  minutes: number;
  alerted: boolean;
  rows: Array<{
    id: number;
    packageId: string;
    packageName: string;
    confirmationCode: string;
    checkIn: string;
    payerName: string;
    amountInr: number;
  }>;
};

export async function runFlagUnconfirmedCron(): Promise<FlagUnconfirmedResult> {
  const minutes = deskConfirmTimeoutMinutes();
  const payload = { minutes };
  let flagged = 0;
  let rows: FlagUnconfirmedResult["rows"] = [];

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb.rpc("tw_flag_unconfirmed", {
        p_gate: SUPABASE_WRITE_GATE,
        p_payload: payload,
      });
      if (error) throw new Error(error.message);
      const body = data as { flagged?: number; rows?: FlagUnconfirmedResult["rows"] };
      flagged = Number(body?.flagged ?? 0);
      rows = Array.isArray(body?.rows) ? body.rows : [];
    }
  } else if (!shouldSkipNeon()) {
    try {
      const sql = await getSql();
      const res = await sql`select tw_flag_unconfirmed(${JSON.stringify(payload)}::jsonb) as result`;
      const body = res[0]?.result as { flagged?: number; rows?: FlagUnconfirmedResult["rows"] };
      flagged = Number(body?.flagged ?? 0);
      rows = Array.isArray(body?.rows) ? body.rows : [];
    } catch (err) {
      if (isDurableDbError(err)) markDurableDbFailed(err);
      throw err;
    }
  }

  let alerted = false;
  if (flagged > 0 && mailConfigured()) {
    const lines = [
      `${flagged} paid stay(s) still awaiting hotel confirmation after ${minutes} minutes.`,
      "",
      ...rows.slice(0, 20).map(
        (r) =>
          `${r.confirmationCode} · ${r.packageName} · ${r.payerName} · check-in ${r.checkIn} · ₹${r.amountInr}`,
      ),
    ];
    try {
      alerted = await sendMail({
        to: opsAlertEmail(),
        subject: `[TripWeave] ${flagged} unconfirmed paid stay(s)`,
        text: lines.join("\n"),
      });
    } catch (err) {
      console.error("[cron] flag-unconfirmed mail", err);
    }
  }

  return { ok: true, flagged, minutes, alerted, rows };
}
