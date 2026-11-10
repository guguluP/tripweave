import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { questionHasDocumentDigits } from "@/lib/arrival-ask";
import { SOURCES } from "@/lib/arrival-rules";
import { IMD_PURI_URL } from "@/lib/ask-model";
import { presentAnswer } from "@/lib/ask-present";
import { getSessionUser } from "@/lib/auth/verify.server";
import { replyToAsk } from "@/lib/server/ask-reply";
import { packMap } from "@/lib/visit-places";
import { appendAskTurn, listAskTurns, takeAskSlot } from "@/lib/server/ask-store";

const turn = z.object({
  question: z.string().trim().min(1).max(400),
  answer: z.string().trim().min(1).max(1200),
});

const schema = z.object({
  question: z.string().trim().min(3).max(400),
  nationalities: z.array(z.string().regex(/^[A-Z]{2}$/)).max(12).optional().default([]),
  oci: z.array(z.boolean()).max(12).optional(),
  priorIndianVisa: z.array(z.boolean()).max(12).optional(),
  arrivalAirport: z.string().regex(/^[A-Z]{3}$/).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  packageId: z.string().trim().max(80).optional(),
  roomId: z.string().trim().max(40).optional(),
  nights: z.number().int().min(1).max(14).optional(),
  arriveBy: z.enum(["fly", "train", "bus", "road"]).optional(),
  confirmationCode: z.string().trim().max(40).optional(),
  groupToken: z.string().trim().min(16).max(80).optional(),
  history: z.array(turn).max(4).optional(),
});

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function sessionUser(request: Request) {
  const header = request.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;
  return getSessionUser(bearer);
}

async function groupAsk(token: string, question: string, userId: string | null): Promise<string | null> {
  const { sha256Hex } = await import("@/lib/group/privacy");
  const { loadGroup } = await import("@/lib/server/group-store");
  const { memberIdFromCookie } = await import("@/lib/server/group-session");
  const { answerGroupQuestion } = await import("@/lib/group/ask");
  const { memberLabel } = await import("@/lib/group/privacy");
  const { getPackage } = await import("@/lib/packages");
  const doc = await loadGroup({ tokenHash: await sha256Hex(token) });
  if (!doc) return null;
  const memberId = await memberIdFromCookie(doc.trip.id);
  const organiser = Boolean(userId && userId === doc.trip.organiserUserId);
  if (!organiser && !memberId) return "unauthorized";
  const me = organiser ? doc.members.find((member) => member.isOrganiser) : doc.members.find((member) => member.id === memberId);
  const share = me ? doc.shares.find((row) => row.memberId === me.id && row.status !== "void") : undefined;
  const hotel = doc.trip.lockedPackageId ? getPackage(doc.trip.lockedPackageId) : undefined;
  const text = answerGroupQuestion(question, {
    role: organiser ? "organiser" : "member",
    status: doc.trip.status,
    checkIn: doc.trip.checkIn,
    nights: doc.trip.nights,
    myShareInr: share?.amountInr ?? null,
    payDeadlineAt: doc.trip.payDeadlineAt,
    hotelName: hotel?.name ?? null,
    unpaidLabels: doc.shares.filter((row) => row.status === "open").map((row) => {
      const member = doc.members.find((item) => item.id === row.memberId);
      return member ? memberLabel(member.displayName) : "Guest";
    }),
  });
  if (!text) return null;
  const slot = organiser && userId ? userId : `group:${memberId ?? "visitor"}`;
  if (!(await takeAskSlot(slot))) return "rate_limited";
  return text;
}

function streamAnswer(text: string, userId: string, question: string, code?: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (value: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      try {
        if (code && userId !== "group") await appendAskTurn(userId, code, question, text);
        send({ type: "done", answer: text, chips: [], tripweave: true, map: [] });
      } catch (err) {
        console.error("[ask]", err instanceof Error ? err.name : "failed");
        send({ type: "error", reason: "unavailable" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/ask")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user) return json({ ok: false, reason: "unauthorized" }, 401);
        const code = new URL(request.url).searchParams.get("confirmationCode")?.trim() ?? "";
        if (!/^[A-Za-z0-9-]{3,40}$/.test(code)) return json({ turns: [] });
        const turns = await listAskTurns(user.id, code);
        return json({ turns });
      },
      POST: async ({ request }) => {
        const user = await sessionUser(request);
        let data: z.infer<typeof schema>;
        try {
          data = schema.parse(await request.json());
        } catch {
          return json({ ok: false, reason: "unavailable" }, 400);
        }
        if (!user && !data.groupToken) return json({ ok: false, reason: "unauthorized" }, 401);
        const asked = [data.question, ...(data.history ?? []).map((row) => row.question)];
        if (asked.some((question) => questionHasDocumentDigits(question))) {
          return json({ ok: false, reason: "no_documents" });
        }
        const groupText = data.groupToken ? await groupAsk(data.groupToken, data.question, user?.id ?? null) : null;
        if (groupText === "unauthorized") return json({ ok: false, reason: "unauthorized" }, 401);
        if (groupText === "rate_limited") return json({ ok: false, reason: "rate_limited" });
        if (!user && !groupText) return json({ ok: false, reason: "unauthorized" }, 401);
        if (groupText) {
          return streamAnswer(groupText, user?.id ?? "group", data.question, data.confirmationCode);
        }
        if (!user) return json({ ok: false, reason: "unauthorized" }, 401);
        if (!(await takeAskSlot(user.id))) return json({ ok: false, reason: "rate_limited" });

        const reply = await replyToAsk({ ...data, userId: user.id });
        const answer = packMap(reply.text, reply.markers);
        const allowed = [
          ...Object.values(SOURCES).map((source) => source.url),
          IMD_PURI_URL,
          "https://www.mappls.com/",
        ];
        const view = presentAnswer(reply.text, allowed);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (value: unknown) => {
              controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
            };
            try {
              if (data.confirmationCode) {
                await appendAskTurn(user.id, data.confirmationCode, data.question, answer);
              }
              send({
                type: "done",
                answer: view.prose,
                chips: view.chips,
                tripweave: view.tripweave,
                map: reply.markers,
              });
            } catch (err) {
              console.error("[ask]", err instanceof Error ? err.name : "failed");
              send({ type: "error", reason: "unavailable" });
            } finally {
              controller.close();
            }
          },
        });
        return new Response(stream, {
          headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
