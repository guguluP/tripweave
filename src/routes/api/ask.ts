import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { acceptGroundedReply, ASK_SYSTEM, groundingPacket, questionHasDocumentDigits } from "@/lib/arrival-ask";
import { presentAnswer } from "@/lib/ask-present";
import { getSessionUser } from "@/lib/auth/verify.server";
import { isCountryCode } from "@/lib/countries";
import { appendAskTurn, listAskTurns, takeAskSlot } from "@/lib/server/ask-store";
import { findOwnBookingByCode } from "@/lib/server/booking-lookup";

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
  locale: z.enum(["en", "hi"]).optional(),
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

async function readXaiStream(
  res: Response,
  write: (text: string) => void,
): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    buf += decoder.decode(step.value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          write(delta);
        }
      } catch {
        /* ignore a partial SSE line */
      }
    }
  }
  return full;
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
        const apiKey = process.env.XAI_API_KEY?.trim();
        if (!apiKey) return json({ ok: false, reason: "not_configured" });
        if (!(await takeAskSlot(user.id))) return json({ ok: false, reason: "rate_limited" });

        const nationalities = data.nationalities.filter((code) => isCountryCode(code));
        let packageId = data.packageId;
        let roomId = data.roomId;
        let checkIn = data.checkIn;
        let nights = data.nights;
        let amountInr: number | null = null;
        let status: string | null = null;
        if (data.confirmationCode) {
          const own = await findOwnBookingByCode(user.id, data.confirmationCode);
          if (own) {
            packageId = own.packageId;
            roomId = own.roomId || roomId;
            checkIn = own.checkIn;
            nights = own.nights;
            amountInr = own.amountInr;
            status = own.status;
          }
        }
        const packet = groundingPacket({
          nationalities,
          oci: data.oci,
          priorIndianVisa: data.priorIndianVisa,
          arrivalAirport: data.arrivalAirport,
          checkIn,
          packageId,
          roomId,
          nights,
          arriveBy: data.arriveBy,
          amountInr,
          status,
        });
        const locale = data.locale === "hi" ? "hi" : "en";
        const earlier = (data.history ?? [])
          .map((row) => `Earlier question: ${row.question}\nEarlier answer: ${row.answer}`)
          .join("\n\n");
        const model = process.env.XAI_MODEL?.trim() || "grok-4.7";

        let upstream: Response;
        try {
          upstream = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              stream: true,
              temperature: 0,
              messages: [
                { role: "system", content: ASK_SYSTEM },
                {
                  role: "user",
                  content: `${earlier ? `Conversation so far (not a source):\n${earlier}\n\n` : ""}Guest locale: ${locale}\nQuestion: ${data.question}\n\nSources:\n${packet.text}`,
                },
              ],
            }),
          });
        } catch (err) {
          console.error("[ask]", err instanceof Error ? err.name : "failed");
          return json({ ok: false, reason: "unavailable" });
        }
        if (!upstream.ok || !upstream.body) {
          console.error("[ask] xAI", upstream.status);
          return json({ ok: false, reason: "unavailable" });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (value: unknown) => {
              controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
            };
            try {
              const raw = await readXaiStream(upstream, (text) => send({ type: "token", text }));
              const answer = acceptGroundedReply(raw, packet.urls);
              const view = presentAnswer(answer, packet.urls);
              if (data.confirmationCode) {
                await appendAskTurn(user.id, data.confirmationCode, data.question, answer);
              }
              send({ type: "done", answer: view.prose, chips: view.chips, tripweave: view.tripweave });
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
