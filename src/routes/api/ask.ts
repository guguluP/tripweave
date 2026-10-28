import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ASK_SUGGESTIONS, answerQuestion, questionHasDocumentDigits, REDACTED_QUESTION } from "@/lib/arrival-ask";
import { OFFICIAL_URLS, presentAnswer } from "@/lib/ask-present";
import { getSessionUser } from "@/lib/auth/verify.server";
import { isCountryCode } from "@/lib/countries";
import { isClosedStay } from "@/lib/refund-policy";
import { appendAskTurn, forgetAskThread, listAskTurns, takeAskSlot } from "@/lib/server/ask-store";
import { checkAskHeaders, readCappedText } from "@/lib/server/ask-request";
import { findOwnBookingByCode } from "@/lib/server/booking-lookup";

/**
 * Ask TripWeave. Answers come only from this stay's facts (stayFactLines) and the arrival
 * rules in src/lib/arrival-rules.ts, through the deterministic answerQuestion. No outside API
 * or AI model is called. The client never sends earlier turns: the saved thread is loaded
 * here, and only for a booking this user owns.
 */
const schema = z
  .object({
    question: z.string().trim().min(3).max(400).optional(),
    /** A fixed suggestion tap. The server picks the question text, so it cannot carry free text. */
    suggestion: z.enum(["fly", "refund", "car", "desk"]).optional(),
    nationalities: z.array(z.string().regex(/^[A-Z]{2}$/)).max(12).optional().default([]),
    oci: z.array(z.boolean()).max(12).optional(),
    priorIndianVisa: z.array(z.boolean()).max(12).optional(),
    arrivalAirport: z.string().regex(/^[A-Z]{3}$/).optional(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    packageId: z.string().trim().max(80).optional(),
    roomId: z.string().trim().max(40).optional(),
    nights: z.number().int().min(1).max(14).optional(),
    arriveBy: z.enum(["fly", "train", "bus", "road"]).optional(),
    confirmationCode: z.string().trim().regex(/^[A-Za-z0-9-]{3,40}$/).optional(),
    locale: z.enum(["en", "hi"]).optional(),
  })
  .strict()
  .refine((data) => Boolean(data.suggestion || data.question), { message: "Ask a question." });

/** Saved with the redacted placeholder when a question looked like a document number. */
const NO_DOCUMENTS_REPLY = "Leave out passport and visa numbers.";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
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
        try {
          const own = await findOwnBookingByCode(user.id, code);
          if (!own) return json({ turns: [] });
          if (isClosedStay(own.status)) {
            await forgetAskThread(user.id, code);
            return json({ turns: [] });
          }
          return json({ turns: await listAskTurns(user.id, code) });
        } catch (err) {
          console.error("[ask] thread", err instanceof Error ? err.name : "failed");
          return json({ turns: [] });
        }
      },
      POST: async ({ request }) => {
        const guard = checkAskHeaders(request);
        if (guard) return json({ ok: false, reason: guard.reason }, guard.status);
        const user = await sessionUser(request);
        if (!user) return json({ ok: false, reason: "unauthorized" }, 401);
        const raw = await readCappedText(request);
        if (raw === null) return json({ ok: false, reason: "too_large" }, 413);
        let data: z.infer<typeof schema>;
        try {
          data = schema.parse(JSON.parse(raw));
        } catch {
          return json({ ok: false, reason: "unavailable" }, 400);
        }
        const question = data.suggestion ? ASK_SUGGESTIONS[data.suggestion] : (data.question ?? "");

        const slot = await takeAskSlot(user.id, data.suggestion ? "suggest" : "typed");
        if (slot === "limited") return json({ ok: false, reason: "rate_limited" });
        if (slot === "error") return json({ ok: false, reason: "unavailable" });

        try {
          const own = data.confirmationCode ? await findOwnBookingByCode(user.id, data.confirmationCode) : null;
          const keepThread = Boolean(own && data.confirmationCode && !isClosedStay(own.status));

          if (!data.suggestion && questionHasDocumentDigits(question)) {
            // Never stored as typed: the thread gets a placeholder instead.
            if (keepThread && data.confirmationCode) {
              await appendAskTurn(user.id, data.confirmationCode, REDACTED_QUESTION, NO_DOCUMENTS_REPLY);
            }
            return json({ ok: false, reason: "no_documents" });
          }

          const grounding = {
            nationalities: data.nationalities.filter((code) => isCountryCode(code)),
            oci: data.oci,
            priorIndianVisa: data.priorIndianVisa,
            arrivalAirport: data.arrivalAirport,
            checkIn: own?.checkIn ?? data.checkIn,
            packageId: own?.packageId ?? data.packageId,
            roomId: own?.roomId || data.roomId,
            nights: own?.nights ?? data.nights,
            arriveBy: data.arriveBy,
            amountInr: own?.amountInr ?? null,
            status: own?.status ?? null,
            notOwner: Boolean(data.confirmationCode) && !own,
          };
          const result = answerQuestion(question, grounding);
          // Same list the sheet uses for saved turns: a fallback can cite a source outside this
          // guest's checklist (an OCI question with no nationality on file cites BOI).
          const view = presentAnswer(result.answer, OFFICIAL_URLS);
          if (keepThread && data.confirmationCode) {
            await appendAskTurn(user.id, data.confirmationCode, question, result.answer);
          }
          return json({ ok: true, answer: view.prose, chips: view.chips, tripweave: view.tripweave });
        } catch (err) {
          console.error("[ask]", err instanceof Error ? err.name : "failed");
          return json({ ok: false, reason: "unavailable" });
        }
      },
    },
  },
});
