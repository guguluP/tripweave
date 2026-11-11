import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSessionUser } from "@/lib/auth/verify.server";
import { addDays } from "@/lib/inventory";
import { isAcceptablePhone, toE164 } from "@/lib/phone";
import { GROUP_INTERESTS, GROUP_NEEDS } from "@/lib/group/types";
import { nextRathStay } from "@/lib/group/parse-brief";
import { newOtpCode, newShareToken, sha256Hex } from "@/lib/group/privacy";
import { shortlistForGroup } from "@/lib/group/shortlist";
import { groupOtpChannel, groupOtpMail, normalizeGroupEmail } from "@/lib/group/otp";
import { projectGroup, type GroupRole, type PublicGroup } from "@/lib/group/view";
import { bookingMailConfigured, sendBookingMail } from "@/lib/mail/send";
import { refreshStayInventory } from "@/lib/server/occupancy";
import { listOrganiserGroups, loadGroup, mutateGroup } from "@/lib/server/group-store";
import { memberIdFromCookie, requestIp, signMemberCookie } from "@/lib/server/group-session";
import { sendWhatsApp } from "@/lib/server/notify/whatsapp";
import type { GroupDoc } from "@/lib/group/engine";

const needs = z.array(z.enum(GROUP_NEEDS)).max(3);
const interests = z.array(z.enum(GROUP_INTERESTS)).max(4);

const createSchema = z.object({
  title: z.string().trim().max(80).optional(),
  dateMode: z.enum(["dates", "rath_yatra"]),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nights: z.number().int().min(1).max(14).optional(),
  adults: z.number().int().min(1).max(30),
  children: z.number().int().min(0).max(20).default(0),
  elderly: z.number().int().min(0).max(20).default(0),
  budgetPerHeadInr: z.number().int().positive().max(500000).nullable().optional(),
  needs: needs.default([]),
  interests: interests.default([]),
  voteClosesAt: z.string().datetime(),
  organiserName: z.string().trim().min(1).max(60),
});

async function shortlistFor(input: z.infer<typeof createSchema>, checkIn: string, nights: number) {
  const checkout = addDays(checkIn, nights);
  const { listPackages } = await import("@/lib/packages");
  for (const pkg of listPackages()) {
    await refreshStayInventory(pkg.id, checkIn, checkout).catch(() => undefined);
  }
  return shortlistForGroup({
    checkIn,
    nights,
    adults: input.adults,
    children: input.children,
    elderly: input.elderly,
    budgetPerHeadInr: input.budgetPerHeadInr ?? null,
    needs: input.needs,
    interests: input.interests,
  });
}

function devCodeAllowed() {
  return !process.env.VERCEL && process.env.NODE_ENV !== "production";
}

async function present(doc: GroupDoc, role: GroupRole, memberId: string | null): Promise<PublicGroup> {
  const state = projectGroup(doc, role, memberId);
  return { ...state, otpChannel: groupOtpChannel() };
}

/** A signed cookie only counts while that person is still on the trip. */
function activeMemberId(doc: GroupDoc, memberId: string | null): string | null {
  if (!memberId) return null;
  return doc.members.some((member) => member.id === memberId && !member.leftAt) ? memberId : null;
}

function istToday(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

export const createGroupTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (data.elderly > data.adults) return { ok: false as const, message: "Elderly guests are part of the adult count." };
    const rath = data.dateMode === "rath_yatra" ? nextRathStay() : null;
    const checkIn = rath?.checkIn ?? data.checkIn;
    const nights = rath?.nights ?? data.nights;
    if (!checkIn || !nights) return { ok: false as const, message: "Choose a check-in and the number of nights." };
    if (checkIn < istToday()) return { ok: false as const, message: "Choose a check-in from today onwards." };
    if (Date.parse(data.voteClosesAt) >= Date.parse(`${checkIn}T12:00:00+05:30`)) {
      return { ok: false as const, message: "Voting has to close before check-in." };
    }
    const shortlist = await shortlistFor(data, checkIn, nights);
    if (shortlist.length === 0) return { ok: false as const, message: "No Puri stay fits this party." };
    const token = newShareToken();
    const created = await mutateGroup({ tokenHash: "" }, "create", {
      token_hash: await sha256Hex(token),
      organiser_user_id: context.userId,
      organiser_name: data.organiserName,
      title: data.title || "Puri darshan",
      lang: "en",
      date_mode: data.dateMode,
      check_in: checkIn,
      nights,
      adults: data.adults,
      children: data.children,
      elderly: data.elderly,
      budget_per_head_inr: data.budgetPerHeadInr ?? null,
      needs: data.needs,
      interests: data.interests,
      shortlist,
    });
    if (!created.ok || !created.doc) return { ok: false as const, message: "The trip could not be saved." };
    const published = await mutateGroup({ tripId: created.doc.trip.id }, "publish", {
      vote_closes_at: data.voteClosesAt,
      shortlist,
    });
    if (!published.ok) return { ok: false as const, message: "Set a voting deadline that is still ahead." };
    const { recordFunnelEvent } = await import("@/lib/server/funnel");
    await recordFunnelEvent("group_published", shortlist[0]?.packageId);
    return { ok: true as const, token, tripId: created.doc.trip.id };
  });

export const listMyGroupTrips = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => listOrganiserGroups(context.userId));

export const getGroupState = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ token: z.string().min(16).max(80).optional(), tripId: z.string().uuid().optional() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true; state: PublicGroup } | { ok: false; message: string }> => {
    const tokenHash = data.token ? await sha256Hex(data.token) : undefined;
    // A share link opens by its token alone. A trip id alone is the organiser's own page.
    let doc = tokenHash ? await loadGroup({ tokenHash }) : await loadGroup({ tripId: data.tripId });
    if (!doc) return { ok: false, message: "This link is not a TripWeave group." };
    const user = await getSessionUser().catch(() => null);
    if (data.tripId && doc.trip.id !== data.tripId) return { ok: false, message: "This link is not a TripWeave group." };
    if (!tokenHash && user?.id !== doc.trip.organiserUserId) {
      return { ok: false, message: "This trip belongs to another account." };
    }
    const { touchGroup } = await import("@/lib/server/group-sweep");
    doc = (await touchGroup(doc)) ?? doc;
    const memberId = activeMemberId(doc, await memberIdFromCookie(doc.trip.id));
    const role: GroupRole =
      user?.id === doc.trip.organiserUserId ? "organiser" : memberId ? "member" : "visitor";
    return { ok: true, state: await present(doc, role, role === "organiser" ? doc.members.find((m) => m.isOrganiser)?.id ?? null : memberId) };
  });

export const requestMemberOtp = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      token: z.string().min(16).max(80),
      email: z.string().max(254).optional(),
      phone: z.string().max(20).optional(),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const channel = groupOtpChannel();
    const email = data.email ? normalizeGroupEmail(data.email) : null;
    const phone = data.phone ? toE164(data.phone) : null;
    if (phone && (!phone.startsWith("+91") || !isAcceptablePhone(phone))) {
      return { ok: false as const, message: "Use an Indian mobile number." };
    }
    if (channel === "email") {
      if (!email) return { ok: false as const, message: "Use a valid email address." };
    } else if (!phone) {
      return { ok: false as const, message: "Use an Indian mobile number." };
    }
    const tokenHash = await sha256Hex(data.token);
    const doc = await loadGroup({ tokenHash });
    if (!doc) return { ok: false as const, message: "This link is not a TripWeave group." };
    const code = newOtpCode();
    const result = await mutateGroup({ tripId: doc.trip.id }, "request_otp", {
      phone_hash: phone ? await sha256Hex(phone) : "",
      email_hash: email ? await sha256Hex(email) : "",
      code_hash: await sha256Hex(`${doc.trip.id}:${code}`),
      ip_hash: await sha256Hex(requestIp()),
    });
    if (!result.ok) {
      return { ok: false as const, message: result.error === "otp_limited" ? "Wait a few minutes before asking for another code." : "Joining is closed." };
    }
    if (channel === "whatsapp") {
      const sent = await sendWhatsApp(phone!, `TripWeave code ${code}. It expires in 10 minutes.`);
      return { ok: true as const, sent, devCode: devCodeAllowed() && !sent ? code : undefined };
    }
    if (!bookingMailConfigured()) {
      if (devCodeAllowed()) return { ok: true as const, sent: false, devCode: code };
      return { ok: false as const, message: "We couldn't send the join code by email. Try again later." };
    }
    try {
      const mail = groupOtpMail({
        code,
        title: doc.trip.title,
        checkIn: doc.trip.checkIn,
        nights: doc.trip.nights,
      });
      const sent = await sendBookingMail({ to: email!, subject: mail.subject, text: mail.text });
      if (!sent) {
        if (devCodeAllowed()) return { ok: true as const, sent: false, devCode: code };
        return { ok: false as const, message: "We couldn't send the join code by email. Try again later." };
      }
      return { ok: true as const, sent: true };
    } catch {
      return { ok: false as const, message: "We couldn't send the join code by email. Try again later." };
    }
  });

export const verifyMemberOtp = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      token: z.string().min(16).max(80),
      email: z.string().max(254).optional(),
      phone: z.string().max(20).optional(),
      code: z.string().regex(/^\d{6}$/),
      displayName: z.string().trim().min(1).max(60),
      isElderly: z.boolean().default(false),
      needs: needs.default([]),
      familyLabel: z.string().trim().max(40).optional(),
      whatsappOptIn: z.boolean().default(false),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const channel = groupOtpChannel();
    const email = data.email ? normalizeGroupEmail(data.email) : null;
    const phone = data.phone ? toE164(data.phone) : null;
    if (phone && (!phone.startsWith("+91") || !isAcceptablePhone(phone))) {
      return { ok: false as const, message: "Use an Indian mobile number." };
    }
    if (channel === "email") {
      if (!email) return { ok: false as const, message: "Use a valid email address." };
    } else if (!phone) {
      return { ok: false as const, message: "Use an Indian mobile number." };
    }
    const tokenHash = await sha256Hex(data.token);
    const doc = await loadGroup({ tokenHash });
    if (!doc) return { ok: false as const, message: "This link is not a TripWeave group." };
    const result = await mutateGroup({ tripId: doc.trip.id }, "verify_member", {
      phone_hash: phone ? await sha256Hex(phone) : "",
      email_hash: email ? await sha256Hex(email) : "",
      code_hash: await sha256Hex(`${doc.trip.id}:${data.code}`),
      email: email ?? "",
      phone_e164: phone ?? "",
      display_name: data.displayName,
      is_elderly: data.isElderly,
      needs: data.needs,
      family_label: data.familyLabel ?? "",
      whatsapp_opt_in: data.whatsappOptIn,
    });
    if (!result.ok || !result.doc) {
      const message =
        result.ok ? "Could not join." :
        result.error === "otp_mismatch" ? "That code does not match." :
        result.error === "otp_expired" ? "That code has expired. Ask for a new one." :
        result.error === "otp_limited" ? "Too many tries. Ask for a new code." :
        result.error === "member_cap" ? "This group is full." : "Could not join.";
      return { ok: false as const, message };
    }
    const memberId = String((result.dev as { member_id?: string } | undefined)?.member_id ?? "");
    if (memberId) await signMemberCookie(doc.trip.id, memberId);
    return { ok: true as const, state: await present(result.doc, "member", memberId || null) };
  });

export const castGroupVote = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      token: z.string().min(16).max(80),
      packageId: z.string().min(1).max(80),
      note: z.string().max(200).optional(),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const tokenHash = await sha256Hex(data.token);
    const doc = await loadGroup({ tokenHash });
    if (!doc) return { ok: false as const, message: "This link is not a TripWeave group." };
    const memberId = activeMemberId(doc, await memberIdFromCookie(doc.trip.id));
    const user = await getSessionUser().catch(() => null);
    const voter = user?.id === doc.trip.organiserUserId
      ? doc.members.find((member) => member.isOrganiser)?.id
      : memberId;
    if (!voter) return { ok: false as const, message: "Join the group before voting." };
    const result = await mutateGroup({ tripId: doc.trip.id }, "vote", {
      member_id: voter,
      package_id: data.packageId,
      note: data.note ?? "",
    });
    if (!result.ok || !result.doc) {
      return { ok: false as const, message: result.ok ? "Could not save the vote." : result.error === "vote_closed" ? "Voting has closed." : "Could not save the vote." };
    }
    const role: GroupRole = user?.id === doc.trip.organiserUserId ? "organiser" : "member";
    return { ok: true as const, state: await present(result.doc, role, voter) };
  });

export const lockGroupStay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ tripId: z.string().uuid(), packageId: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data, context }) => {
    const doc = await loadGroup({ tripId: data.tripId });
    if (!doc || doc.trip.organiserUserId !== context.userId) return { ok: false as const, message: "Only the organiser can lock a stay." };
    const stay = doc.shortlist.find((row) => row.packageId === data.packageId);
    if (!stay?.lockable) return { ok: false as const, message: "The hotel has not published enough rooms for these nights." };
    const fresh = await shortlistFor(
      {
        title: doc.trip.title,
        dateMode: doc.trip.dateMode,
        checkIn: doc.trip.checkIn,
        nights: doc.trip.nights,
        adults: doc.trip.adults,
        children: doc.trip.children,
        elderly: doc.trip.elderly,
        budgetPerHeadInr: doc.trip.budgetPerHeadInr,
        needs: doc.trip.needs as z.infer<typeof needs>,
        interests: doc.trip.interests as z.infer<typeof interests>,
        voteClosesAt: new Date().toISOString(),
        organiserName: "Organiser",
      },
      doc.trip.checkIn,
      doc.trip.nights,
    );
    const again = fresh.find((row) => row.packageId === data.packageId);
    if (!again?.lockable) return { ok: false as const, message: "Those rooms are no longer published. Pick another stay." };
    if (again.totalInr !== stay.totalInr) {
      return { ok: false as const, message: `The total changed to ₹${again.totalInr.toLocaleString("en-IN")}. Lock again to accept it.`, totalInr: again.totalInr };
    }
    const maxRooms = Number(process.env.TW_GROUP_MAX_ROOMS || 8);
    const result = await mutateGroup({ tripId: doc.trip.id }, "lock", {
      organiser_user_id: context.userId,
      package_id: data.packageId,
      rooms: again.rooms,
      total_inr: again.totalInr,
      max_rooms: Number.isFinite(maxRooms) ? maxRooms : 8,
    });
    if (!result.ok || !result.doc) return { ok: false as const, message: "The stay could not be locked." };
    const replaced = result.doc.shortlist.map((row) => (row.packageId === again.packageId ? again : row));
    result.doc.shortlist = replaced;
    return { ok: true as const, state: await present(result.doc, "organiser", result.doc.members.find((m) => m.isOrganiser)?.id ?? null) };
  });

export const sendGroupShares = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z.object({
      tripId: z.string().uuid(),
      token: z.string().min(16).max(80),
      mode: z.enum(["equal", "custom", "per_family", "organiser"]),
      payDeadlineAt: z.string().datetime(),
      custom: z.array(z.object({ memberId: z.string().uuid(), amountInr: z.number().int().positive() })).max(30).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const doc = await loadGroup({ tripId: data.tripId });
    if (!doc || doc.trip.organiserUserId !== context.userId) return { ok: false as const, message: "Only the organiser can send shares." };
    // The token goes into every payment link's return URL, so it has to be this trip's own link.
    if ((await sha256Hex(data.token)) !== doc.trip.shareTokenHash) {
      return { ok: false as const, message: "Open the trip from its own link and try again." };
    }
    const result = await mutateGroup({ tripId: data.tripId }, "set_split", {
      mode: data.mode,
      pay_deadline_at: data.payDeadlineAt,
      custom: data.custom ?? [],
    });
    if (!result.ok || !result.doc) {
      const message = !result.ok && result.error === "deadline"
        ? "The payment deadline has to be at least 72 hours before check-in noon IST."
        : "The shares do not add up to the stay total.";
      return { ok: false as const, message };
    }
    if (result.doc.trip.status === "collecting") {
      const { createShareLinks } = await import("@/lib/server/group-razorpay");
      await createShareLinks(result.doc, data.token);
    }
    const fresh = await loadGroup({ tripId: data.tripId });
    return { ok: true as const, state: await present(fresh ?? result.doc, "organiser", result.doc.members.find((m) => m.isOrganiser)?.id ?? null) };
  });

export const cancelGroupTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ tripId: z.string().uuid(), reason: z.string().max(80).optional() }).parse(data))
  .handler(async ({ data, context }) => {
    const result = await mutateGroup({ tripId: data.tripId }, "cancel", {
      organiser_user_id: context.userId,
      reason: data.reason ?? "organiser",
    });
    if (!result.ok || !result.doc) return { ok: false as const, message: "This trip can no longer be cancelled." };
    const { cancelShareLink } = await import("@/lib/server/group-razorpay");
    for (const share of result.doc.shares) if (share.razorpayLinkId && share.status !== "paid") await cancelShareLink(share.razorpayLinkId);
    const { cancelGroupRoomBookings } = await import("@/lib/server/group-desk");
    await cancelGroupRoomBookings(result.doc.trip.id);
    return { ok: true as const, state: await present(result.doc, "organiser", null) };
  });

export const removeGroupMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ tripId: z.string().uuid(), memberId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const doc = await loadGroup({ tripId: data.tripId });
    if (!doc || doc.trip.organiserUserId !== context.userId) return { ok: false as const, message: "Only the organiser can remove someone." };
    const result = await mutateGroup({ tripId: data.tripId }, "remove_member", { member_id: data.memberId });
    if (!result.ok || !result.doc) return { ok: false as const, message: "A person who has paid stays on the trip until it is cancelled." };
    return { ok: true as const, state: await present(result.doc, "organiser", null) };
  });
