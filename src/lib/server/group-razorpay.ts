import { appBaseUrl } from "@/lib/server/desk-auth";
import { mutateGroup, loadGroup } from "@/lib/server/group-store";
import type { GroupDoc } from "@/lib/group/engine";
import { groupPaymentFromWebhook, isGroupShareNotes } from "@/lib/group/webhook";

function keys() {
  const id = process.env.RAZORPAY_KEY_ID?.trim() || process.env.VITE_RAZORPAY_KEY_ID?.trim() || "";
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  return { id, secret };
}

function authHeader() {
  const { id, secret } = keys();
  if (!id || !secret) return null;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export function groupNotes(doc: GroupDoc, shareId: string, memberId: string) {
  return { kind: "group_share", gt: doc.trip.id, gs: shareId, gm: memberId, v: "1" };
}

export { isGroupShareNotes };

/** One Razorpay Payment Link per open share. Notes never include userId or packageId. */
export async function createShareLinks(doc: GroupDoc, rawToken: string) {
  const header = authHeader();
  if (!header) return;
  const expire = doc.trip.payDeadlineAt ? Math.floor(Date.parse(doc.trip.payDeadlineAt) / 1000) : undefined;
  for (const share of doc.shares) {
    if (share.status !== "open" || share.razorpayLinkId) continue;
    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: { Authorization: header, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: share.amountInr * 100,
        currency: "INR",
        accept_partial: false,
        description: `TripWeave share · ${doc.trip.title}`.slice(0, 200),
        reference_id: share.id,
        expire_by: expire,
        reminder_enable: false,
        callback_url: `${appBaseUrl()}/g/${rawToken}?paid=1`,
        callback_method: "get",
        notify: { sms: false, email: false },
        notes: groupNotes(doc, share.id, share.memberId),
      }),
    });
    if (!res.ok) {
      console.error("[group] payment link", res.status);
      continue;
    }
    const json = (await res.json()) as { id?: string; short_url?: string };
    if (!json.id) continue;
    await mutateGroup({ tripId: doc.trip.id }, "mark_link", {
      share_id: share.id,
      razorpay_link_id: json.id,
      short_url: json.short_url ?? "",
    });
  }
}

export async function cancelShareLink(linkId: string) {
  const header = authHeader();
  if (!header || !linkId) return;
  await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}/cancel`, {
    method: "POST",
    headers: { Authorization: header },
  }).catch(() => undefined);
}

export async function fetchShareLink(linkId: string): Promise<{ status: string; paymentId: string | null; amountInr: number } | null> {
  const header = authHeader();
  if (!header || !linkId) return null;
  const res = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, { headers: { Authorization: header } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    status?: string;
    amount?: number;
    payments?: { payment_id?: string; status?: string }[];
  };
  const paid = json.payments?.find((row) => row.status === "captured" || row.payment_id);
  return {
    status: json.status ?? "",
    paymentId: paid?.payment_id ?? null,
    amountInr: Math.round((json.amount ?? 0) / 100),
  };
}

/** Apply a paid link before a deadline is allowed to lapse. */
export async function recheckOpenLinks(doc: GroupDoc) {
  for (const share of doc.shares) {
    if (share.status !== "open" || !share.razorpayLinkId) continue;
    const link = await fetchShareLink(share.razorpayLinkId);
    if (link?.status === "paid" && link.paymentId) {
      await applyGroupPayment({
        tripId: doc.trip.id,
        shareId: share.id,
        memberId: share.memberId,
        paymentId: link.paymentId,
        amountInr: share.amountInr,
        method: "upi",
      });
    }
  }
}

export async function applyGroupPayment(input: {
  tripId: string;
  shareId: string;
  memberId: string;
  paymentId: string;
  amountInr: number;
  method: string;
}) {
  const hours = Number(process.env.TW_GROUP_DESK_HOURS || 24);
  const result = await mutateGroup({ tripId: input.tripId }, "apply_payment", {
    razorpay_payment_id: input.paymentId,
    share_id: input.shareId,
    member_id: input.memberId,
    amount_inr: input.amountInr,
    method: input.method === "card" || input.method === "upi" || input.method === "netbanking" ? input.method : "upi",
    desk_hours: Number.isFinite(hours) && hours > 0 ? hours : 24,
  });
  if (result.ok && result.dev && (result.dev as { fully_paid?: boolean }).fully_paid && result.doc) {
    const { insertGroupBookings } = await import("@/lib/server/group-bookings");
    const { notifyGroupDesk } = await import("@/lib/server/desk-notify");
    const { getPackage } = await import("@/lib/packages");
    try {
      const bookings = await insertGroupBookings(result.doc);
      await mutateGroup({ tripId: input.tripId }, "attach_bookings", { bookings });
      const pkg = getPackage(result.doc.trip.lockedPackageId ?? "");
      await notifyGroupDesk({
        tripId: result.doc.trip.id,
        packageId: result.doc.trip.lockedPackageId ?? "",
        packageName: pkg?.name ?? "Puri stay",
        checkIn: result.doc.trip.checkIn,
        nights: result.doc.trip.nights,
        guests: result.doc.trip.adults + result.doc.trip.children,
        elderly: result.doc.trip.elderly,
        needs: result.doc.trip.needs,
        rooms: result.doc.trip.lockedRooms.reduce((sum, room) => sum + room.units, 0),
        amountInr: result.doc.trip.requiredInr,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      console.error("[group] bookings", message || "failed");
      if (/sold|occupan|no keys|not enough/i.test(message) && result.doc.trip.lockedPackageId) {
        const { settleGroupDesk } = await import("@/lib/server/group-desk");
        await settleGroupDesk({
          tripId: input.tripId,
          packageId: result.doc.trip.lockedPackageId,
          action: "desk_decline",
        });
      }
    }
  }
  return result;
}

export async function applyGroupWebhook(eventName: string, payload: Record<string, unknown>): Promise<boolean> {
  const link = (payload.payment_link as { entity?: { notes?: Record<string, string> } } | undefined)?.entity;
  const payment = (payload.payment as { entity?: { notes?: Record<string, string> } } | undefined)?.entity;
  const orderNotes = (payload.order as { entity?: { notes?: Record<string, string> } } | undefined)?.entity?.notes;
  const notes = link?.notes ?? payment?.notes ?? orderNotes ?? {};
  if (!eventName.startsWith("payment_link.") && !isGroupShareNotes(notes)) return false;
  const paid = groupPaymentFromWebhook(eventName, payload);
  if (paid) await applyGroupPayment(paid);
  return true;
}

export async function loadByTokenHash(tokenHash: string) {
  return loadGroup({ tokenHash });
}
