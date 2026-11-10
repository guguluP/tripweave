import { getPackage } from "../packages.ts";
import { memberLabel, maskPhone } from "./privacy.ts";
import type { GroupDoc } from "./engine.ts";
import type { GroupStatus } from "./types.ts";

export type GroupRole = "visitor" | "member" | "organiser";

export type PublicGroup = {
  tripId: string;
  version: number;
  status: GroupStatus;
  title: string;
  lang: "en" | "hi" | "or";
  dateMode: "dates" | "rath_yatra";
  checkIn: string;
  nights: number;
  adults: number;
  children: number;
  elderly: number;
  needs: string[];
  interests: string[];
  budgetPerHeadInr: number | null;
  voteClosesAt: string | null;
  payDeadlineAt: string | null;
  deskDeadlineAt: string | null;
  totalInr: number;
  requiredInr: number;
  splitMode: string | null;
  lockedPackageId: string | null;
  hotelName: string | null;
  shortlist: GroupDoc["shortlist"];
  voteCounts: { packageId: string; votes: number }[];
  memberCount: number;
  paidCount: number;
  pendingCount: number;
  role: GroupRole;
  me: {
    memberId: string;
    label: string;
    shareInr: number | null;
    shareStatus: string | null;
    payUrl: string | null;
  } | null;
  people: { label: string; paid: boolean | null; phone: string | null; elderly: boolean }[] | null;
  vouchers: GroupDoc["bookings"];
  cancelReason: string | null;
};

/** Visitor sees counts and the shortlist. Members see names. The organiser sees masked phones. */
export function projectGroup(doc: GroupDoc, role: GroupRole, memberId: string | null): PublicGroup {
  const active = doc.members.filter((member) => !member.leftAt);
  const paidIds = new Set(doc.shares.filter((share) => share.status === "paid").map((share) => share.memberId));
  const counts = new Map<string, number>();
  for (const vote of doc.votes) counts.set(vote.packageId, (counts.get(vote.packageId) ?? 0) + 1);
  const mine = memberId ? doc.members.find((member) => member.id === memberId && !member.leftAt) : undefined;
  const myShare = mine ? doc.shares.find((share) => share.memberId === mine.id && share.status !== "void") : undefined;
  const hotel = doc.trip.lockedPackageId ? getPackage(doc.trip.lockedPackageId) : undefined;
  const showPeople = role !== "visitor";
  return {
    tripId: doc.trip.id,
    version: doc.trip.version,
    status: doc.trip.status,
    title: doc.trip.title,
    lang: doc.trip.lang,
    dateMode: doc.trip.dateMode,
    checkIn: doc.trip.checkIn,
    nights: doc.trip.nights,
    adults: doc.trip.adults,
    children: doc.trip.children,
    elderly: doc.trip.elderly,
    needs: doc.trip.needs,
    interests: doc.trip.interests,
    budgetPerHeadInr: doc.trip.budgetPerHeadInr,
    voteClosesAt: doc.trip.voteClosesAt,
    payDeadlineAt: doc.trip.payDeadlineAt,
    deskDeadlineAt: doc.trip.deskDeadlineAt,
    totalInr: doc.trip.totalInr,
    requiredInr: doc.trip.requiredInr,
    splitMode: doc.trip.splitMode,
    lockedPackageId: doc.trip.lockedPackageId,
    hotelName: hotel?.name ?? null,
    shortlist: doc.shortlist,
    voteCounts: doc.shortlist.map((stay) => ({ packageId: stay.packageId, votes: counts.get(stay.packageId) ?? 0 })),
    memberCount: active.length,
    paidCount: doc.shares.filter((share) => share.status === "paid").length,
    pendingCount: doc.shares.filter((share) => share.status === "open").length,
    role,
    me: mine
      ? {
          memberId: mine.id,
          label: memberLabel(mine.displayName),
          shareInr: myShare?.amountInr ?? null,
          shareStatus: myShare?.status ?? null,
          payUrl: myShare?.razorpayShortUrl ?? null,
        }
      : null,
    people: showPeople
      ? active.map((member) => ({
          label: memberLabel(member.displayName),
          paid: doc.shares.some((share) => share.memberId === member.id) ? paidIds.has(member.id) : null,
          phone: role === "organiser" ? maskPhone(member.phoneE164) : null,
          elderly: member.isElderly,
        }))
      : null,
    vouchers: role === "visitor" ? [] : doc.bookings,
    cancelReason: doc.trip.cancelReason,
  };
}
