import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { checklistForParty, renderChecklistText } from "@/lib/arrival-rules";
import { isCountryCode } from "@/lib/countries";
import { bookingMailConfigured, sendBookingMail } from "@/lib/mail/send";
import { allowRequest } from "@/lib/server/rate-limit";

const schema = z.object({
  nationalities: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(12),
  oci: z.array(z.boolean()).max(12).optional(),
  priorIndianVisa: z.array(z.boolean()).max(12).optional(),
  confirmationCode: z.string().max(40).optional(),
  arrivalAirport: z.string().regex(/^[A-Z]{3}$/).optional(),
});

export const emailArrivalChecklist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ context, data }) => {
    const nationalities = data.nationalities.filter((code) => isCountryCode(code));
    if (nationalities.length === 0) return { ok: false as const, reason: "mail_not_configured" as const };
    if (!allowRequest(`checklist-mail:${context.userId}`, 3, 60 * 60_000)) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    if (!allowRequest("checklist-mail:all", 200, 60 * 60_000)) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    const to = context.email?.trim();
    if (!to || !bookingMailConfigured()) return { ok: false as const, reason: "mail_not_configured" as const };
    const items = checklistForParty({
      nationalities,
      oci: data.oci,
      priorIndianVisa: data.priorIndianVisa,
      arrivalAirport: data.arrivalAirport ?? "BBI",
    });
    const code = (data.confirmationCode || "").replace(/[^\w-]/g, "").slice(0, 40);
    const subject = code ? `India arrival checklist (${code})` : "India arrival checklist";
    try {
      const sent = await sendBookingMail({
        to,
        subject,
        text: renderChecklistText(items),
      });
      if (!sent) return { ok: false as const, reason: "mail_not_configured" as const };
      return { ok: true as const };
    } catch (err) {
      console.error("[arrival-mail]", err instanceof Error ? err.message : "send failed");
      return { ok: false as const, reason: "mail_not_configured" as const };
    }
  });
