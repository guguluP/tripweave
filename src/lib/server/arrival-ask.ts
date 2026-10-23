import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { acceptGroundedReply, groundingPacket, questionHasDocumentDigits } from "@/lib/arrival-ask";
import { isCountryCode } from "@/lib/countries";
import { findOwnBookingByCode } from "@/lib/server/booking-lookup";
import { allowRequest } from "@/lib/server/rate-limit";

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

export const askTripWeave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ context, data }) => {
    const asked = [data.question, ...(data.history ?? []).map((row) => row.question)];
    if (asked.some((question) => questionHasDocumentDigits(question))) {
      return { ok: false as const, reason: "no_documents" as const };
    }
    if (!allowRequest(`ask:${context.userId}`, 10, 60 * 60_000)) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    const apiKey = process.env.XAI_API_KEY?.trim();
    if (!apiKey) return { ok: false as const, reason: "not_configured" as const };
    const nationalities = data.nationalities.filter((code) => isCountryCode(code));
    let packageId = data.packageId;
    let roomId = data.roomId;
    let checkIn = data.checkIn;
    let nights = data.nights;
    let amountInr: number | null = null;
    let status: string | null = null;
    if (data.confirmationCode) {
      const own = await findOwnBookingByCode(context.userId, data.confirmationCode);
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
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: false,
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "Answer only from the sources in the user message. An entry answer must cite one of those URLs and no other site. A TripWeave answer (lines that start with TripWeave:) must contain the word TripWeave and no URL. A mixed answer must do both. If the sources do not state the answer, reply with exactly: Not stated by the official sources TripWeave checked; see <one of those URLs>. Do not invent fees, airports, or rules. Do not ask for or repeat passport numbers, visa numbers, phone numbers, or payment references. Earlier questions are conversation, not sources. If the guest locale is Hindi, answer in Hindi. That Hindi is unofficial. Keep any official URL unchanged.",
            },
            {
              role: "user",
              content: `${earlier ? `Conversation so far (not a source):\n${earlier}\n\n` : ""}Guest locale: ${locale}\nQuestion: ${data.question}\n\nSources:\n${packet.text}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        console.error("[ask] xAI", res.status);
        return { ok: false as const, reason: "unavailable" as const };
      }
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = body.choices?.[0]?.message?.content ?? "";
      return { ok: true as const, answer: acceptGroundedReply(String(content), packet.urls) };
    } catch (err) {
      console.error("[ask]", err instanceof Error ? err.name : "failed");
      return { ok: false as const, reason: "unavailable" as const };
    }
  });
