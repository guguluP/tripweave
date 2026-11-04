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
        if (!user) return json({ ok: false, reason: "unauthorized" }, 401);
        let data: z.infer<typeof schema>;
        try {
          data = schema.parse(await request.json());
        } catch {
          return json({ ok: false, reason: "unavailable" }, 400);
        }
        const asked = [data.question, ...(data.history ?? []).map((row) => row.question)];
        if (asked.some((question) => questionHasDocumentDigits(question))) {
          return json({ ok: false, reason: "no_documents" });
        }
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
              const step = 48;
              for (let i = 0; i < view.prose.length; i += step) {
                send({ type: "token", text: view.prose.slice(i, i + step) });
              }
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
