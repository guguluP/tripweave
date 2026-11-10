/** Group pilgrimage trip. Nine states, server-owned. */

export const GROUP_STATUSES = [
  "draft",
  "voting",
  "locked",
  "collecting",
  "fully_paid_awaiting_hotel",
  "hotel_confirmed",
  "completed",
  "expired",
  "cancelled",
] as const;

export type GroupStatus = (typeof GROUP_STATUSES)[number];

export const GROUP_NEEDS = ["wheelchair", "ground_floor", "lift"] as const;
export const GROUP_INTERESTS = ["darshan", "gundicha", "konark", "beach"] as const;
export type GroupNeed = (typeof GROUP_NEEDS)[number];
export type GroupInterest = (typeof GROUP_INTERESTS)[number];

export type SplitMode = "equal" | "custom" | "per_family" | "organiser";

export type LockedRoom = {
  roomId: string;
  units: number;
  /** Nightly room rate in rupees, one entry per night, snapshot at lock. */
  nightly: number[];
};

export type ShortlistStay = {
  packageId: string;
  name: string;
  area: string;
  rank: number;
  fit: number;
  trustScore: number;
  templeMinutes: number | null;
  rateKind: string;
  totalInr: number;
  perHeadInr: number;
  roomsReleased: boolean;
  lockable: boolean;
  note: string;
  rooms: LockedRoom[];
};

export type GroupMember = {
  id: string;
  displayName: string;
  phoneE164: string | null;
  phoneHash: string | null;
  isOrganiser: boolean;
  isElderly: boolean;
  needs: GroupNeed[];
  familyLabel: string | null;
  whatsappOptIn: boolean;
  consentAt: string | null;
  leftAt: string | null;
};

export type GroupVote = {
  memberId: string;
  packageId: string;
  note: string;
};

export type GroupShare = {
  id: string;
  memberId: string;
  amountInr: number;
  status: "open" | "paid" | "void";
  razorpayLinkId: string | null;
  razorpayShortUrl: string | null;
  familyLabel: string | null;
};

export type GroupPayment = {
  id: string;
  shareId: string;
  memberId: string;
  razorpayPaymentId: string;
  amountInr: number;
  method: string;
  late: boolean;
};

export type GroupRefund = {
  id: string;
  paymentId: string;
  razorpayPaymentId: string;
  amountInr: number;
  reason: string;
  status: "pending" | "applied" | "failed";
};

export type GroupRoomBooking = {
  roomId: string;
  confirmationCode: string;
  amountInr: number;
  travelers: number;
  status: string;
};

export const MEMBER_CAP = 30;
export const PHONE_RETENTION_DAYS = 14;
export const MAX_GROUP_ROOMS_DEFAULT = 8;
