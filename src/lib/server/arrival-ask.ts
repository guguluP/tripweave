import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { acceptGroundedReply, groundingPacket, questionHasDocumentDigits } from "@/lib/arrival-ask";
import { isCountryCode } from "@/lib/countries";
import { allowRequest } from "@/lib/server/rate-limit";

const schema = z.object({
  question: z.string().trim().min(3).max(400),
  nationalities: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(12),
  oci: z.array(z.boolean()).max(12).optional(),
  priorIndianVisa: z.array(z.boolean()).max(12).optional(),
  arrivalAirport: z.string().regex(/^[A-Z]{3}$/).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const askTripWeave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ context, data }) => {
    if (questionHasDocumentDigits(data.question)) {
      return { ok: false as const, reason: "no_documents" as const };
    }
    if (!allowRequest(`ask:${context.userId}`, 10, 60 * 60_000)) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    const apiKey = process.env.XAI_API_KEY?.trim();
    if (!apiKey) return { ok: false as const, reason: "not_configured" as const };
    const nationalities = data.nationalities.filter((code) => isCountryCode(code));
    if (nationalities.length === 0) return { ok: false as const, reason: "not_configured" as const };
    const packet = groundingPacket({
      nationalities,
      oci: data.oci,
      priorIndianVisa: data.priorIndianVisa,
      arrivalAirport: data.arrivalAirport,
      checkIn: data.checkIn,
    });
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
                "Answer only from the sources in the user message. Cite one of those URLs in the answer. If the sources do not state the answer, reply with exactly: Not stated by the official sources TripWeave checked; see <one of those URLs>. Do not invent fees, airports, or rules. Do not ask for or repeat passport numbers, visa numbers, or phone numbers.",
            },
            {
              role: "user",
              content: `Question: ${data.question}\n\nSources:\n${packet.text}`,
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
