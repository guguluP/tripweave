import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setNightUnits, replaceAllotment } from "../allotment-store.ts";
import { getPackage } from "../packages.ts";
import { answerGroupQuestion } from "./ask.ts";
import { groupDayPlan } from "./day-plan.ts";
import { parseGroupBrief, nextRathStay } from "./parse-brief.ts";
import { groupOtpChannel, groupOtpMail, normalizeGroupEmail } from "./otp.ts";
import { memberLabel, maskEmail, maskPhone } from "./privacy.ts";
import { groupRefundPlan } from "./refunds.ts";
import { shortlistForGroup } from "./shortlist.ts";
import { splitShares } from "./split.ts";
import { nextStatus } from "./state.ts";
import type { GroupMember, GroupPayment } from "./types.ts";

const members: GroupMember[] = [
  { id: "org", displayName: "Meera Das", email: null, emailHash: null, phoneE164: null, phoneHash: null, isOrganiser: true, isElderly: false, needs: [], familyLabel: "das", whatsappOptIn: false, consentAt: null, leftAt: null },
  { id: "a", displayName: "Arun Das", email: null, emailHash: null, phoneE164: null, phoneHash: null, isOrganiser: false, isElderly: false, needs: [], familyLabel: "das", whatsappOptIn: true, consentAt: null, leftAt: null },
  { id: "b", displayName: "Bina Das", email: null, emailHash: null, phoneE164: null, phoneHash: null, isOrganiser: false, isElderly: true, needs: [], familyLabel: null, whatsappOptIn: false, consentAt: null, leftAt: null },
];

describe("group state", () => {
  it("follows the allowed edges and rejects the rest", () => {
    assert.equal(nextStatus("draft", "publish"), "voting");
    assert.equal(nextStatus("voting", "lock"), "locked");
    assert.equal(nextStatus("locked", "unlock"), "voting");
    assert.equal(nextStatus("locked", "shares_sent"), "collecting");
    assert.equal(nextStatus("collecting", "required_paid"), "fully_paid_awaiting_hotel");
    assert.equal(nextStatus("collecting", "deadline_lapsed"), "expired");
    assert.equal(nextStatus("fully_paid_awaiting_hotel", "desk_confirm"), "hotel_confirmed");
    assert.equal(nextStatus("fully_paid_awaiting_hotel", "desk_decline"), "cancelled");
    assert.equal(nextStatus("hotel_confirmed", "organiser_cancel"), "cancelled");
    assert.equal(nextStatus("hotel_confirmed", "checkout_passed"), "completed");
    assert.equal(nextStatus("voting", "required_paid"), null);
    assert.equal(nextStatus("completed", "organiser_cancel"), null);
  });
});

describe("split shares", () => {
  it("splits equal rupees and gives the remainder to the organiser", () => {
    const rows = splitShares({ totalInr: 100, members, mode: "equal", organiserId: "org" });
    assert.ok(rows);
    assert.equal(rows.reduce((sum, row) => sum + row.amountInr, 0), 100);
    assert.equal(rows.find((row) => row.memberId === "org")?.amountInr, 34);
    assert.equal(rows.find((row) => row.memberId === "a")?.amountInr, 33);
  });

  it("rejects a custom split that does not add up", () => {
    assert.equal(
      splitShares({
        totalInr: 100,
        members,
        mode: "custom",
        organiserId: "org",
        custom: [
          { memberId: "org", amountInr: 40 },
          { memberId: "a", amountInr: 40 },
        ],
      }),
      null,
    );
  });

  it("puts one share on the organiser when they pay for everyone", () => {
    const rows = splitShares({ totalInr: 9000, members, mode: "organiser", organiserId: "org" });
    assert.equal(rows?.length, 1);
    assert.equal(rows?.[0]?.amountInr, 9000);
  });

  it("splits per family and keeps the remainder on the organiser's family", () => {
    const rows = splitShares({ totalInr: 100, members, mode: "per_family", organiserId: "org" });
    assert.ok(rows);
    assert.equal(rows.reduce((sum, row) => sum + row.amountInr, 0), 100);
    const das = rows.find((row) => row.memberId === "org");
    assert.equal(das?.amountInr, 50);
  });
});

describe("group refunds", () => {
  const payments: GroupPayment[] = [
    { id: "p1", shareId: "s1", memberId: "a", razorpayPaymentId: "pay_a", amountInr: 4000, method: "upi", late: false },
  ];

  it("refunds a captured share in full before the hotel confirms", () => {
    const lines = groupRefundPlan({
      status: "fully_paid_awaiting_hotel",
      checkIn: "2026-12-01",
      payments,
      reason: "decline",
    });
    assert.equal(lines[0]?.amountInr, 4000);
    assert.equal(lines[0]?.fraction, 1);
  });

  it("refunds nothing after the hotel has confirmed", () => {
    const lines = groupRefundPlan({
      status: "hotel_confirmed",
      checkIn: "2026-12-01",
      payments,
      reason: "member_drop",
      now: new Date("2026-11-01T00:00:00Z"),
    });
    assert.equal(lines[0]?.amountInr, 0);
  });
});

describe("parse brief", () => {
  it("reads the family sentence", () => {
    const parsed = parseGroupBrief("13 people, 3 grandparents, darshan + Konark, June, ₹3,000 per head", new Date("2026-01-15T00:00:00Z"));
    assert.equal(parsed.adults, 13);
    assert.equal(parsed.elderly, 3);
    assert.equal(parsed.children, 0);
    assert.deepEqual(parsed.interests, ["darshan", "konark"]);
    assert.equal(parsed.budgetPerHeadInr, 3000);
    assert.equal(parsed.checkIn, "2026-06-01");
    assert.equal(parsed.dateMode, "dates");
  });

  it("uses the next Rath Yatra window", () => {
    const stay = nextRathStay(new Date("2026-01-15T00:00:00Z"));
    assert.equal(stay.checkIn, "2026-06-26");
    const parsed = parseGroupBrief("Rath Yatra, 8 adults", new Date("2026-01-15T00:00:00Z"));
    assert.equal(parsed.dateMode, "rath_yatra");
    assert.equal(parsed.checkIn, "2026-06-26");
    assert.equal(parsed.adults, 8);
  });
});

describe("privacy masks", () => {
  it("shows a first name and last initial, and a masked phone", () => {
    assert.equal(memberLabel("Meera Das"), "Meera D.");
    assert.equal(maskPhone("+919876543210"), "+91 •••• 3210");
    assert.equal(maskEmail("meera.das@example.com"), "m•••@example.com");
  });
});

describe("group join code channel", () => {
  it("defaults to email and switches to WhatsApp when asked", () => {
    assert.equal(groupOtpChannel({}), "email");
    assert.equal(groupOtpChannel({ TW_GROUP_OTP_CHANNEL: "email" }), "email");
    assert.equal(groupOtpChannel({ TW_GROUP_OTP_CHANNEL: "WhatsApp" }), "whatsapp");
  });

  it("normalises email addresses and rejects blanks", () => {
    assert.equal(normalizeGroupEmail("  Meera@Example.COM "), "meera@example.com");
    assert.equal(normalizeGroupEmail("not-an-email"), null);
    assert.equal(normalizeGroupEmail("  "), null);
  });

  it("writes a short mail with the code, trip name, and dates", () => {
    const mail = groupOtpMail({ code: "123456", title: "Puri darshan", checkIn: "2026-12-20", nights: 2 });
    assert.equal(mail.subject, "Your TripWeave group code is 123456");
    assert.match(mail.text, /Your TripWeave group code is 123456\. It expires in 10 minutes\./);
    assert.match(mail.text, /Trip: Puri darshan/);
    assert.match(mail.text, /Dates: 2026-12-20, 2 nights/);
  });
});

describe("shortlist", () => {
  it("marks a stay lockable only when published units cover the party", () => {
    replaceAllotment([]);
    const pkg = getPackage("taj-puri-resort-spa")!;
    const room = pkg.rooms[0]!;
    for (const night of ["2026-11-20", "2026-11-21"]) {
      setNightUnits({ packageId: pkg.id, roomId: room.id, night, units: 4 });
    }
    const rows = shortlistForGroup({
      checkIn: "2026-11-20",
      nights: 2,
      adults: 2,
      children: 0,
      elderly: 0,
      budgetPerHeadInr: null,
      needs: [],
      interests: ["darshan"],
    });
    assert.ok(rows.length >= 1);
    assert.ok(rows.length <= 5);
    const taj = rows.find((row) => row.packageId === pkg.id);
    assert.equal(taj?.lockable, true);
    assert.ok((taj?.totalInr ?? 0) > 0);
    const unpublished = rows.find((row) => row.packageId !== pkg.id);
    if (unpublished) assert.equal(unpublished.lockable, false);
  });
});

describe("day plan and ask", () => {
  it("shortens an outing day when elderly guests are coming", () => {
    const days = groupDayPlan("taj-puri-resort-spa", 3, 2, "2026-06-26");
    assert.ok(days.length >= 1);
    assert.ok(days.some((day) => day.note?.includes("Rath Yatra") || day.note?.includes("elderly") || day.note?.includes("short")));
  });

  it("answers a share question and hides the unpaid list from members", () => {
    const share = answerGroupQuestion("How much is my share?", {
      role: "member",
      status: "collecting",
      checkIn: "2026-11-20",
      nights: 2,
      myShareInr: 4200,
      payDeadlineAt: "2026-11-16T06:30:00.000Z",
      hotelName: "Taj Puri",
      unpaidLabels: ["Arun D."],
    });
    assert.match(share ?? "", /4,200/);
    const unpaid = answerGroupQuestion("Who has not paid?", {
      role: "member",
      status: "collecting",
      checkIn: "2026-11-20",
      nights: 2,
      myShareInr: 4200,
      payDeadlineAt: null,
      hotelName: null,
      unpaidLabels: ["Arun D."],
    });
    assert.match(unpaid ?? "", /organiser/i);
  });
});
