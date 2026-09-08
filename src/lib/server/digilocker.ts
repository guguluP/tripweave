import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  DIGILOCKER_DOC_OPTIONS,
  SANDBOX_PROFILES,
  issuedDocsFromProfile,
  travelerFromSandbox,
  type DigilockerDocId,
} from "@/lib/digilocker";
import type { Traveler } from "@/lib/travelers";

const startSchema = z.object({
  guestIndex: z.number().int().min(0).max(7),
});

const completeSchema = z.object({
  guestIndex: z.number().int().min(0).max(7),
  otp: z.string().trim(),
  docs: z.array(z.enum(["aadhaar", "pan", "dl", "passport"])).min(1),
});

export type DigilockerStartResult =
  | { ok: true; mode: "sandbox"; sessionId: string; hint: string }
  | { ok: true; mode: "live"; authorizeUrl: string }
  | { ok: false; message: string };

export type DigilockerCompleteResult =
  | { ok: true; mode: "sandbox" | "live"; traveler: Traveler }
  | { ok: false; message: string };

function liveReady() {
  return Boolean(
    process.env.DIGILOCKER_CLIENT_ID?.trim() && process.env.DIGILOCKER_CLIENT_SECRET?.trim(),
  );
}

/**
 * Starts a DigiLocker requester session.
 * Live: returns the official OAuth authorize URL when partner creds exist.
 * Otherwise: labelled sandbox session (consent + OTP in-app).
 */
export const startDigilockerSession = createServerFn({ method: "POST" })
  .validator((input: unknown) => startSchema.parse(input))
  .handler(async ({ data }): Promise<DigilockerStartResult> => {
    if (liveReady()) {
      const clientId = process.env.DIGILOCKER_CLIENT_ID!.trim();
      const redirect =
        process.env.DIGILOCKER_REDIRECT_URI?.trim() ||
        "https://tripweave-web.vercel.app/api/digilocker/callback";
      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirect,
        state: `guest-${data.guestIndex}`,
      });
      return {
        ok: true,
        mode: "live",
        authorizeUrl: `https://api.digitallocker.gov.in/public/oauth2/1/authorize?${params.toString()}`,
      };
    }
    return {
      ok: true,
      mode: "sandbox",
      sessionId: `dl-sandbox-${data.guestIndex}-${Date.now()}`,
      hint: "123456",
    };
  });

/** Completes the sandbox OTP and returns issued-document fields for one guest. */
export const completeDigilockerSandbox = createServerFn({ method: "POST" })
  .validator((input: unknown) => completeSchema.parse(input))
  .handler(async ({ data }): Promise<DigilockerCompleteResult> => {
    const otp = data.otp.replace(/\D/g, "");
    if (otp.length !== 6) {
      return { ok: false, message: "Enter the 6-digit sandbox OTP." };
    }
    if (otp !== "123456") {
      return { ok: false, message: "Sandbox OTP is 123456." };
    }
    const profile = SANDBOX_PROFILES[data.guestIndex % SANDBOX_PROFILES.length]!;
    const docs = data.docs as DigilockerDocId[];
    const traveler = travelerFromSandbox(profile, docs, false);
    traveler.issuedDocs = issuedDocsFromProfile(profile, docs);
    return { ok: true, mode: "sandbox", traveler };
  });

export const DIGILOCKER_DOC_CATALOG = DIGILOCKER_DOC_OPTIONS;
