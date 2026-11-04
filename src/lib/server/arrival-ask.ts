import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { questionHasDocumentDigits } from "@/lib/arrival-ask";
import { packMap } from "@/lib/visit-places";
import { replyToAsk } from "@/lib/server/ask-reply";
import { appendAskTurn, takeAskSlot } from "@/lib/server/ask-store";

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

export const askTripWeave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ context, data }) => {
    const asked = [data.question, ...(data.history ?? []).map((row) => row.question)];
    if (asked.some((question) => questionHasDocumentDigits(question))) {
      return { ok: false as const, reason: "no_documents" as const };
    }
    if (!(await takeAskSlot(context.userId))) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    const reply = await replyToAsk({ ...data, userId: context.userId });
    const answer = packMap(reply.text, reply.markers);
    if (data.confirmationCode) {
      await appendAskTurn(context.userId, data.confirmationCode, data.question, answer);
    }
    return { ok: true as const, answer };
  });
