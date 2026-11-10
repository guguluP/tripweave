import { paymentDeadlineOk } from "./deadlines.ts";
import { groupRefundPlan, type GroupRefundReason } from "./refunds.ts";
import { splitShares, type ShareDraft } from "./split.ts";
import { nextStatus } from "./state.ts";
import {
  MEMBER_CAP,
  type GroupMember,
  type GroupPayment,
  type GroupRefund,
  type GroupRoomBooking,
  type GroupShare,
  type GroupStatus,
  type GroupVote,
  type LockedRoom,
  type ShortlistStay,
  type SplitMode,
} from "./types.ts";

export type GroupTripRow = {
  id: string;
  shareTokenHash: string;
  organiserUserId: string;
  title: string;
  lang: "en" | "hi" | "or";
  dateMode: "dates" | "rath_yatra";
  checkIn: string;
  nights: number;
  adults: number;
  children: number;
  elderly: number;
  budgetPerHeadInr: number | null;
  needs: string[];
  interests: string[];
  status: GroupStatus;
  lockedPackageId: string | null;
  lockedRooms: LockedRoom[];
  totalInr: number;
  requiredInr: number;
  splitMode: SplitMode | null;
  voteClosesAt: string | null;
  payDeadlineAt: string | null;
  deskDeadlineAt: string | null;
  version: number;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OtpRow = {
  id: string;
  phoneHash: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  sentAt: string;
  ipHash: string;
};

export type GroupDoc = {
  trip: GroupTripRow;
  members: GroupMember[];
  shortlist: ShortlistStay[];
  votes: GroupVote[];
  shares: GroupShare[];
  payments: GroupPayment[];
  refunds: GroupRefund[];
  otps: OtpRow[];
  bookings: GroupRoomBooking[];
};

export type EngineResult =
  | { ok: true; doc: GroupDoc; noop?: boolean; dev?: Record<string, unknown> }
  | { ok: false; error: string; version?: number; doc?: GroupDoc; persist?: boolean };

const OTP_WINDOW_MS = 15 * 60 * 1000;

function bump(doc: GroupDoc, now: string, event: string, from: GroupStatus, to: GroupStatus) {
  doc.trip.version += 1;
  doc.trip.updatedAt = now;
  doc.trip.status = to;
  void event;
  void from;
}

function versionGuard(doc: GroupDoc, expected: unknown): EngineResult | null {
  if (expected == null) return null;
  const want = Number(expected);
  if (!Number.isInteger(want) || want !== doc.trip.version) {
    return { ok: false, error: "version", version: doc.trip.version, doc };
  }
  return null;
}

function activeMembers(doc: GroupDoc) {
  return doc.members.filter((member) => !member.leftAt);
}

function queueRefunds(doc: GroupDoc, reason: GroupRefundReason, now: Date) {
  const lines = groupRefundPlan({
    status: doc.trip.status,
    checkIn: doc.trip.checkIn,
    payments: doc.payments,
    reason,
    now,
  });
  for (const line of lines) {
    if (line.amountInr < 1) continue;
    if (doc.refunds.some((row) => row.paymentId === line.paymentId && row.reason === line.reason && row.status !== "failed")) {
      continue;
    }
    doc.refunds.push({
      id: crypto.randomUUID(),
      paymentId: line.paymentId,
      razorpayPaymentId: line.razorpayPaymentId,
      amountInr: line.amountInr,
      reason: line.reason,
      status: "pending",
    });
  }
}

export function applyEngine(doc: GroupDoc | null, op: string, payload: Record<string, unknown>, now = new Date()): EngineResult {
  const iso = now.toISOString();
  if (op === "create") return createTrip(payload, iso);
  if (!doc) return { ok: false, error: "missing" };
  const guarded = versionGuard(doc, payload.expected_version);
  if (op !== "get_state" && op !== "request_otp" && guarded) return guarded;

  if (op === "get_state") return { ok: true, doc };
  if (op === "publish") return publish(doc, payload, iso);
  if (op === "request_otp") return requestOtp(doc, payload, now);
  if (op === "verify_member") return verifyMember(doc, payload, now);
  if (op === "vote") return vote(doc, payload, now);
  if (op === "lock") return lock(doc, payload, iso);
  if (op === "unlock") return unlock(doc, iso);
  if (op === "set_split") return setSplit(doc, payload, now);
  if (op === "mark_link") return markLink(doc, payload, iso);
  if (op === "apply_payment") return applyPayment(doc, payload, now);
  if (op === "expire") return expire(doc, now);
  if (op === "cancel") return cancel(doc, payload, now);
  if (op === "desk_result") return deskResult(doc, payload, now);
  if (op === "remove_member") return removeMember(doc, payload, iso);
  if (op === "resplit") return setSplit(doc, payload, now);
  if (op === "attach_bookings") return attachBookings(doc, payload, iso);
  if (op === "complete_if_due") return completeIfDue(doc, now);
  if (op === "scrub_phones") return scrubPhones(doc, now);
  if (op === "mark_refund") return markRefund(doc, payload, iso);
  return { ok: false, error: "unknown_op", doc };
}

function createTrip(payload: Record<string, unknown>, iso: string): EngineResult {
  const adults = Number(payload.adults);
  const children = Number(payload.children ?? 0);
  const elderly = Number(payload.elderly ?? 0);
  const nights = Number(payload.nights);
  const checkIn = String(payload.check_in ?? "");
  if (!Number.isInteger(adults) || adults < 1) return { ok: false, error: "adults" };
  if (!Number.isInteger(children) || children < 0) return { ok: false, error: "children" };
  if (!Number.isInteger(elderly) || elderly < 0 || elderly > adults) return { ok: false, error: "elderly" };
  if (!Number.isInteger(nights) || nights < 1 || nights > 14) return { ok: false, error: "nights" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) return { ok: false, error: "check_in" };
  const hash = String(payload.token_hash ?? "");
  const organiserUserId = String(payload.organiser_user_id ?? "");
  if (hash.length < 32 || !organiserUserId) return { ok: false, error: "token" };
  const id = crypto.randomUUID();
  const organiserId = crypto.randomUUID();
  const doc: GroupDoc = {
    trip: {
      id,
      shareTokenHash: hash,
      organiserUserId,
      title: String(payload.title ?? "Puri darshan").slice(0, 80),
      lang: payload.lang === "hi" || payload.lang === "or" ? payload.lang : "en",
      dateMode: payload.date_mode === "rath_yatra" ? "rath_yatra" : "dates",
      checkIn,
      nights,
      adults,
      children,
      elderly,
      budgetPerHeadInr: payload.budget_per_head_inr == null ? null : Number(payload.budget_per_head_inr),
      needs: stringList(payload.needs),
      interests: stringList(payload.interests),
      status: "draft",
      lockedPackageId: null,
      lockedRooms: [],
      totalInr: 0,
      requiredInr: 0,
      splitMode: null,
      voteClosesAt: null,
      payDeadlineAt: null,
      deskDeadlineAt: null,
      version: 0,
      cancelReason: null,
      createdAt: iso,
      updatedAt: iso,
    },
    members: [
      {
        id: organiserId,
        displayName: String(payload.organiser_name ?? "Organiser").slice(0, 60),
        phoneE164: null,
        phoneHash: null,
        isOrganiser: true,
        isElderly: false,
        needs: [],
        familyLabel: null,
        whatsappOptIn: false,
        consentAt: iso,
        leftAt: null,
      },
    ],
    shortlist: Array.isArray(payload.shortlist) ? (payload.shortlist as ShortlistStay[]) : [],
    votes: [],
    shares: [],
    payments: [],
    refunds: [],
    otps: [],
    bookings: [],
  };
  return { ok: true, doc };
}

function publish(doc: GroupDoc, payload: Record<string, unknown>, iso: string): EngineResult {
  const next = nextStatus(doc.trip.status, "publish");
  if (!next) return { ok: false, error: "status", doc };
  const closes = String(payload.vote_closes_at ?? "");
  if (Number.isNaN(new Date(closes).getTime())) return { ok: false, error: "vote_closes", doc };
  if (new Date(closes).getTime() <= Date.parse(iso)) return { ok: false, error: "vote_closes", doc };
  doc.trip.voteClosesAt = new Date(closes).toISOString();
  if (Array.isArray(payload.shortlist)) doc.shortlist = payload.shortlist as ShortlistStay[];
  bump(doc, iso, "publish", doc.trip.status, next);
  return { ok: true, doc };
}

function requestOtp(doc: GroupDoc, payload: Record<string, unknown>, now: Date): EngineResult {
  if (doc.trip.status !== "voting" && doc.trip.status !== "locked" && doc.trip.status !== "collecting") {
    return { ok: false, error: "status", doc };
  }
  const phoneHash = String(payload.phone_hash ?? "");
  const codeHash = String(payload.code_hash ?? "");
  const ipHash = String(payload.ip_hash ?? "");
  if (!phoneHash || !codeHash) return { ok: false, error: "phone", doc };
  const since = now.getTime() - OTP_WINDOW_MS;
  const recentPhone = doc.otps.filter((row) => row.phoneHash === phoneHash && Date.parse(row.sentAt) >= since);
  const recentIp = doc.otps.filter((row) => ipHash && row.ipHash === ipHash && Date.parse(row.sentAt) >= since);
  const recentTrip = doc.otps.filter((row) => Date.parse(row.sentAt) >= since);
  if (recentPhone.length >= 3 || recentIp.length >= 10 || recentTrip.length >= 20) {
    return { ok: false, error: "otp_limited", doc };
  }
  doc.otps.push({
    id: crypto.randomUUID(),
    phoneHash,
    codeHash,
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    attempts: 0,
    sentAt: now.toISOString(),
    ipHash,
  });
  doc.trip.version += 1;
  doc.trip.updatedAt = now.toISOString();
  return { ok: true, doc };
}

function verifyMember(doc: GroupDoc, payload: Record<string, unknown>, now: Date): EngineResult {
  const phoneHash = String(payload.phone_hash ?? "");
  const codeHash = String(payload.code_hash ?? "");
  const otp = [...doc.otps].reverse().find((row) => row.phoneHash === phoneHash && Date.parse(row.expiresAt) > now.getTime());
  if (!otp) return { ok: false, error: "otp_expired", doc };
  otp.attempts += 1;
  // A wrong guess must be saved, or the 5-try limit never holds and a 6-digit code can be guessed.
  if (otp.attempts > 5 || otp.codeHash !== codeHash) {
    doc.trip.version += 1;
    doc.trip.updatedAt = now.toISOString();
    return { ok: false, error: otp.attempts > 5 ? "otp_limited" : "otp_mismatch", doc, persist: true };
  }
  // One code joins once.
  otp.expiresAt = now.toISOString();
  const existing = doc.members.find((member) => member.phoneHash === phoneHash && !member.leftAt);
  if (existing) return { ok: true, doc, dev: { member_id: existing.id } };
  if (activeMembers(doc).length >= MEMBER_CAP) return { ok: false, error: "member_cap", doc };
  const member: GroupMember = {
    id: crypto.randomUUID(),
    displayName: String(payload.display_name ?? "Guest").slice(0, 60),
    phoneE164: String(payload.phone_e164 ?? "") || null,
    phoneHash,
    isOrganiser: false,
    isElderly: payload.is_elderly === true,
    needs: stringList(payload.needs).filter((item) => item === "wheelchair" || item === "ground_floor" || item === "lift"),
    familyLabel: payload.family_label ? String(payload.family_label).slice(0, 40) : null,
    whatsappOptIn: payload.whatsapp_opt_in === true,
    consentAt: now.toISOString(),
    leftAt: null,
  };
  doc.members.push(member);
  doc.trip.version += 1;
  doc.trip.updatedAt = now.toISOString();
  return { ok: true, doc, dev: { member_id: member.id } };
}

function vote(doc: GroupDoc, payload: Record<string, unknown>, now: Date): EngineResult {
  if (doc.trip.status !== "voting") return { ok: false, error: "status", doc };
  if (doc.trip.voteClosesAt && Date.parse(doc.trip.voteClosesAt) <= now.getTime()) {
    return { ok: false, error: "vote_closed", doc };
  }
  const memberId = String(payload.member_id ?? "");
  const packageId = String(payload.package_id ?? "");
  if (!doc.members.some((member) => member.id === memberId && !member.leftAt)) return { ok: false, error: "member", doc };
  if (!doc.shortlist.some((stay) => stay.packageId === packageId)) return { ok: false, error: "package", doc };
  const note = String(payload.note ?? "").slice(0, 200);
  const existing = doc.votes.find((row) => row.memberId === memberId);
  if (existing) {
    existing.packageId = packageId;
    existing.note = note;
  } else {
    doc.votes.push({ memberId, packageId, note });
  }
  doc.trip.version += 1;
  doc.trip.updatedAt = now.toISOString();
  return { ok: true, doc };
}

function lock(doc: GroupDoc, payload: Record<string, unknown>, iso: string): EngineResult {
  const next = nextStatus(doc.trip.status, "lock");
  if (!next) return { ok: false, error: "status", doc };
  if (String(payload.organiser_user_id ?? "") !== doc.trip.organiserUserId) return { ok: false, error: "organiser", doc };
  const packageId = String(payload.package_id ?? "");
  const stay = doc.shortlist.find((row) => row.packageId === packageId);
  if (!stay?.lockable) return { ok: false, error: "not_lockable", doc };
  const rooms = (payload.rooms as LockedRoom[] | undefined) ?? stay.rooms;
  const total = Number(payload.total_inr ?? stay.totalInr);
  if (!Array.isArray(rooms) || rooms.length === 0 || !Number.isInteger(total) || total < 1) {
    return { ok: false, error: "quote", doc };
  }
  const maxRooms = Number(payload.max_rooms ?? 8);
  const units = rooms.reduce((sum, room) => sum + Number(room.units || 0), 0);
  if (units > maxRooms) return { ok: false, error: "too_many_rooms", doc };
  doc.trip.lockedPackageId = packageId;
  doc.trip.lockedRooms = rooms;
  doc.trip.totalInr = total;
  doc.trip.requiredInr = total;
  bump(doc, iso, "lock", "voting", next);
  return { ok: true, doc };
}

function unlock(doc: GroupDoc, iso: string): EngineResult {
  if (doc.payments.length > 0) return { ok: false, error: "payments", doc };
  const next = nextStatus(doc.trip.status, "unlock");
  if (!next) return { ok: false, error: "status", doc };
  doc.shares = [];
  doc.trip.splitMode = null;
  doc.trip.lockedPackageId = null;
  doc.trip.lockedRooms = [];
  doc.trip.totalInr = 0;
  doc.trip.requiredInr = 0;
  bump(doc, iso, "unlock", "locked", next);
  return { ok: true, doc };
}

function setSplit(doc: GroupDoc, payload: Record<string, unknown>, now: Date): EngineResult {
  if (doc.trip.status !== "locked" && doc.trip.status !== "collecting") return { ok: false, error: "status", doc };
  if (doc.payments.some((payment) => !payment.late)) return { ok: false, error: "payments", doc };
  const mode = String(payload.mode ?? "") as SplitMode;
  if (mode !== "equal" && mode !== "custom" && mode !== "per_family" && mode !== "organiser") {
    return { ok: false, error: "mode", doc };
  }
  const deadline = payload.pay_deadline_at ? String(payload.pay_deadline_at) : "";
  if (deadline && !paymentDeadlineOk(doc.trip.checkIn, deadline, now)) return { ok: false, error: "deadline", doc };
  const organiser = doc.members.find((member) => member.isOrganiser);
  if (!organiser) return { ok: false, error: "organiser", doc };
  const drafts = splitShares({
    totalInr: doc.trip.requiredInr,
    members: doc.members,
    mode,
    organiserId: organiser.id,
    custom: Array.isArray(payload.custom) ? (payload.custom as ShareDraft[]) : undefined,
  });
  if (!drafts) return { ok: false, error: "split", doc };
  doc.shares = drafts.map((row) => ({
    id: crypto.randomUUID(),
    memberId: row.memberId,
    amountInr: row.amountInr,
    status: "open",
    razorpayLinkId: null,
    razorpayShortUrl: null,
    familyLabel: row.familyLabel,
  }));
  doc.trip.splitMode = mode;
  if (deadline) {
    const next = nextStatus(doc.trip.status, "shares_sent");
    if (doc.trip.status === "locked" && next) {
      doc.trip.payDeadlineAt = new Date(deadline).toISOString();
      bump(doc, now.toISOString(), "shares_sent", "locked", next);
      return { ok: true, doc };
    }
    if (doc.trip.status === "collecting") doc.trip.payDeadlineAt = new Date(deadline).toISOString();
  }
  doc.trip.version += 1;
  doc.trip.updatedAt = now.toISOString();
  return { ok: true, doc };
}

function markLink(doc: GroupDoc, payload: Record<string, unknown>, iso: string): EngineResult {
  const share = doc.shares.find((row) => row.id === String(payload.share_id ?? ""));
  if (!share) return { ok: false, error: "share", doc };
  share.razorpayLinkId = String(payload.razorpay_link_id ?? "") || null;
  share.razorpayShortUrl = String(payload.short_url ?? "") || null;
  doc.trip.updatedAt = iso;
  return { ok: true, doc };
}

function applyPayment(doc: GroupDoc, payload: Record<string, unknown>, now: Date): EngineResult {
  const paymentId = String(payload.razorpay_payment_id ?? "");
  const shareId = String(payload.share_id ?? "");
  const amount = Number(payload.amount_inr);
  if (!paymentId.startsWith("pay_") || !Number.isInteger(amount) || amount < 1) return { ok: false, error: "payment", doc };
  if (doc.payments.some((row) => row.razorpayPaymentId === paymentId)) return { ok: true, doc, noop: true };
  const share = doc.shares.find((row) => row.id === shareId);
  // A second payment on a share that is already paid is refunded like a late one.
  const duplicate = share?.status === "paid";
  const late = !share || share.status === "void" || duplicate || doc.trip.status !== "collecting" || share.amountInr !== amount;
  const payment: GroupPayment = {
    id: crypto.randomUUID(),
    shareId: share?.id ?? shareId,
    memberId: share?.memberId ?? String(payload.member_id ?? ""),
    razorpayPaymentId: paymentId,
    amountInr: amount,
    method: String(payload.method ?? "upi").slice(0, 20),
    late,
  };
  doc.payments.push(payment);
  if (late) {
    doc.refunds.push({
      id: crypto.randomUUID(),
      paymentId: payment.id,
      razorpayPaymentId: paymentId,
      amountInr: amount,
      reason: duplicate ? "duplicate" : "late",
      status: "pending",
    });
    doc.trip.version += 1;
    doc.trip.updatedAt = now.toISOString();
    return { ok: true, doc };
  }
  share!.status = "paid";
  const paid = doc.shares.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amountInr, 0);
  if (paid >= doc.trip.requiredInr && doc.trip.status === "collecting") {
    const hours = Number(payload.desk_hours ?? 24);
    doc.trip.deskDeadlineAt = new Date(now.getTime() + hours * 3600 * 1000).toISOString();
    bump(doc, now.toISOString(), "required_paid", "collecting", "fully_paid_awaiting_hotel");
    return { ok: true, doc, dev: { fully_paid: true } };
  }
  doc.trip.version += 1;
  doc.trip.updatedAt = now.toISOString();
  return { ok: true, doc };
}

function expire(doc: GroupDoc, now: Date): EngineResult {
  const next = nextStatus(doc.trip.status, "deadline_lapsed");
  if (!next) return { ok: false, error: "status", doc };
  if (!doc.trip.payDeadlineAt || Date.parse(doc.trip.payDeadlineAt) > now.getTime()) {
    return { ok: false, error: "deadline", doc };
  }
  for (const share of doc.shares) if (share.status === "open") share.status = "void";
  queueRefunds(doc, "expire", now);
  doc.trip.cancelReason = "payment_deadline";
  bump(doc, now.toISOString(), "deadline_lapsed", doc.trip.status, next);
  return { ok: true, doc };
}

function cancel(doc: GroupDoc, payload: Record<string, unknown>, now: Date): EngineResult {
  if (String(payload.organiser_user_id ?? "") !== doc.trip.organiserUserId) return { ok: false, error: "organiser", doc };
  const next = nextStatus(doc.trip.status, "organiser_cancel");
  if (!next) return { ok: false, error: "status", doc };
  const reason: GroupRefundReason = doc.trip.status === "hotel_confirmed" ? "member_drop" : "organiser_cancel";
  queueRefunds(doc, reason, now);
  for (const share of doc.shares) if (share.status === "open") share.status = "void";
  // The rooms go back to the hotel. After a hotel confirmation this is the no-refund cancel.
  for (const booking of doc.bookings) {
    if (booking.status === "paid" || booking.status === "desk_confirmed") booking.status = "cancelled";
  }
  doc.trip.cancelReason = String(payload.reason ?? "organiser").slice(0, 80);
  bump(doc, now.toISOString(), "organiser_cancel", doc.trip.status, next);
  return { ok: true, doc };
}

function deskResult(doc: GroupDoc, payload: Record<string, unknown>, now: Date): EngineResult {
  const action = String(payload.action ?? "");
  if (doc.trip.status !== "fully_paid_awaiting_hotel") return { ok: false, error: "status", doc };
  if (action === "desk_confirm") {
    bump(doc, now.toISOString(), "desk_confirm", doc.trip.status, "hotel_confirmed");
    for (const booking of doc.bookings) if (booking.status === "paid") booking.status = "desk_confirmed";
    return { ok: true, doc };
  }
  if (action === "desk_decline") {
    queueRefunds(doc, "decline", now);
    doc.trip.cancelReason = "desk_declined";
    bump(doc, now.toISOString(), "desk_decline", doc.trip.status, "cancelled");
    for (const booking of doc.bookings) if (booking.status === "paid") booking.status = "cancelled";
    return { ok: true, doc };
  }
  return { ok: false, error: "action", doc };
}

function removeMember(doc: GroupDoc, payload: Record<string, unknown>, iso: string): EngineResult {
  const member = doc.members.find((row) => row.id === String(payload.member_id ?? ""));
  if (!member || member.isOrganiser) return { ok: false, error: "member", doc };
  if (doc.payments.some((payment) => payment.memberId === member.id && !payment.late)) {
    return { ok: false, error: "paid", doc };
  }
  member.leftAt = iso;
  member.phoneE164 = null;
  member.phoneHash = null;
  doc.shares = doc.shares.map((share) => (share.memberId === member.id && share.status === "open" ? { ...share, status: "void" } : share));
  doc.trip.version += 1;
  doc.trip.updatedAt = iso;
  return { ok: true, doc };
}

function attachBookings(doc: GroupDoc, payload: Record<string, unknown>, iso: string): EngineResult {
  if (doc.bookings.length > 0) return { ok: true, doc, noop: true };
  const rows = Array.isArray(payload.bookings) ? payload.bookings : [];
  doc.bookings = rows.map((row) => {
    const item = row as GroupRoomBooking;
    return {
      roomId: String(item.roomId),
      confirmationCode: String(item.confirmationCode),
      amountInr: Number(item.amountInr),
      travelers: Number(item.travelers),
      status: "paid",
    };
  });
  doc.trip.updatedAt = iso;
  return { ok: true, doc };
}

function completeIfDue(doc: GroupDoc, now: Date): EngineResult {
  if (doc.trip.status !== "hotel_confirmed") return { ok: true, doc, noop: true };
  const checkout = new Date(`${doc.trip.checkIn}T00:00:00+05:30`);
  checkout.setDate(checkout.getDate() + doc.trip.nights);
  if (now.getTime() < checkout.getTime()) return { ok: true, doc, noop: true };
  bump(doc, now.toISOString(), "checkout_passed", "hotel_confirmed", "completed");
  return { ok: true, doc };
}

function scrubPhones(doc: GroupDoc, now: Date): EngineResult {
  const end = new Date(`${doc.trip.checkIn}T00:00:00+05:30`);
  end.setDate(end.getDate() + doc.trip.nights + 14);
  if (now.getTime() < end.getTime()) return { ok: true, doc, noop: true };
  if (doc.trip.status !== "completed" && doc.trip.status !== "cancelled" && doc.trip.status !== "expired") {
    return { ok: true, doc, noop: true };
  }
  let changed = false;
  for (const member of doc.members) {
    if (member.isOrganiser) continue;
    if (member.phoneE164 || member.phoneHash) {
      member.phoneE164 = null;
      member.phoneHash = null;
      changed = true;
    }
  }
  if (!changed) return { ok: true, doc, noop: true };
  doc.trip.version += 1;
  doc.trip.updatedAt = now.toISOString();
  return { ok: true, doc };
}

function markRefund(doc: GroupDoc, payload: Record<string, unknown>, iso: string): EngineResult {
  const refund = doc.refunds.find((row) => row.id === String(payload.refund_id ?? ""));
  const status = String(payload.status ?? "");
  if (!refund || (status !== "applied" && status !== "failed")) return { ok: false, error: "refund", doc };
  if (refund.status === status) return { ok: true, doc, noop: true };
  refund.status = status as "applied" | "failed";
  doc.trip.version += 1;
  doc.trip.updatedAt = iso;
  return { ok: true, doc };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string").slice(0, 8);
}
