import { FESTIVAL } from "../inventory.ts";
import { formatMoney } from "../packages.ts";
import { refundPolicyFor } from "../refund-policy.ts";
import { nextRathStay } from "./parse-brief.ts";
import { statusLabel } from "./state.ts";
import type { GroupStatus } from "./types.ts";

export type GroupAskFacts = {
  role: "visitor" | "member" | "organiser";
  status: GroupStatus;
  checkIn: string;
  nights: number;
  myShareInr: number | null;
  payDeadlineAt: string | null;
  hotelName: string | null;
  unpaidLabels: string[];
};

/** Rule answers for a group page. Null means the question is not a group intent. */
export function answerGroupQuestion(question: string, facts: GroupAskFacts, now = new Date()): string | null {
  const q = question.toLowerCase();
  if (/how much|my share|what do i (pay|owe)/.test(q)) {
    if (facts.myShareInr == null) return "Your share is not set yet. It appears after the organiser locks a stay and splits the total.";
    const due = facts.payDeadlineAt ? ` Pay by ${facts.payDeadlineAt}.` : "";
    return `Your share is ${formatMoney(facts.myShareInr)}.${due}`;
  }
  if (/who has not paid|who hasn't paid|unpaid|pending/.test(q)) {
    if (facts.role !== "organiser") return "Only the organiser can see who has not paid.";
    if (facts.unpaidLabels.length === 0) return "Everyone who has a share has paid.";
    return `Still to pay: ${facts.unpaidLabels.join(", ")}.`;
  }
  if (/drop out|cancel my|what if i (leave|cancel)/.test(q)) {
    if (facts.status === "hotel_confirmed" || facts.status === "completed") {
      return "The hotel has confirmed this stay. Dropping out now does not refund the share.";
    }
    if (facts.status === "fully_paid_awaiting_hotel" || facts.status === "collecting") {
      return "Before the hotel confirms, a cancelled trip refunds each captured share in full. One person leaving after shares are sent needs the organiser to re-split.";
    }
    return "You can leave before anyone pays. Your phone number is erased when you leave.";
  }
  if (/rath yatra|rathyatra/.test(q)) {
    const stay = nextRathStay(now);
    const windows = FESTIVAL.filter(([start]) => start.slice(5, 7) === "06")
      .map(([start, end]) => `${start} through ${end}`)
      .join("; ");
    return `Rath Yatra nights in the catalog are ${windows}. The next window this trip would use starts ${stay.checkIn} for ${stay.nights} nights. The festival multiplier applies. No crowd forecast is available.`;
  }
  if (/refund/.test(q) && facts.checkIn) {
    const policy = refundPolicyFor(facts.checkIn, now);
    if (facts.status === "hotel_confirmed") {
      return "The hotel has confirmed the rooms, so cancelling now does not refund the share.";
    }
    return `Before the hotel confirms, a failed or cancelled group trip refunds each share in full. After confirmation the guest rule is: ${policy.label}.`;
  }
  if (/status|deadline|when do we pay/.test(q)) {
    return `This trip is ${statusLabel(facts.status)}.${facts.hotelName ? ` Hotel: ${facts.hotelName}.` : ""} Check-in ${facts.checkIn}, ${facts.nights} nights.`;
  }
  return null;
}
