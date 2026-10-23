import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { ASK_SUGGESTIONS, answerQuestion, askBucket, questionHasDocumentDigits } from "@/lib/arrival-ask";
import { isCountryCode } from "@/lib/countries";
import { findOwnBookingByCode } from "@/lib/server/booking-lookup";
import { allowRequest } from "@/lib/server/rate-limit";

/**
 * Ask TripWeave. Answers come only from this stay's facts and src/lib/arrival-rules.ts.
 * No outside API or AI model is called. Earlier turns are display-only on the client
 * and are never accepted here.
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
    confirmationCode: z.string().trim().max(40).optional(),
    locale: z.enum(["en", "hi"]).optional(),
  })
  .refine((data) => Boolean(data.suggestion || data.question), { message: "Ask a question." });

export const askTripWeave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ context, data }) => {
    const question = data.suggestion ? ASK_SUGGESTIONS[data.suggestion] : (data.question ?? "");
    if (!data.suggestion && questionHasDocumentDigits(question)) {
      return { ok: false as const, reason: "no_documents" as const };
    }
    const bucket = askBucket(context.userId, data.suggestion);
    if (!allowRequest(bucket.name, bucket.limit, bucket.windowMs)) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    const nationalities = data.nationalities.filter((code) => isCountryCode(code));
    let packageId = data.packageId;
    let roomId = data.roomId;
    let checkIn = data.checkIn;
    let nights = data.nights;
    let amountInr: number | null = null;
    let status: string | null = null;
    let notOwner = false;
    try {
      if (data.confirmationCode) {
        const own = await findOwnBookingByCode(context.userId, data.confirmationCode);
        if (own) {
          packageId = own.packageId;
          roomId = own.roomId || roomId;
          checkIn = own.checkIn;
          nights = own.nights;
          amountInr = own.amountInr;
          status = own.status;
        } else {
          notOwner = true;
        }
      }
      const result = answerQuestion(question, {
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
        notOwner,
      });
      return { ok: true as const, answer: result.answer };
    } catch (err) {
      console.error("[ask]", err instanceof Error ? err.name : "failed");
      return { ok: false as const, reason: "unavailable" as const };
    }
  });
