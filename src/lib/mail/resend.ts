import { Resend } from "resend";

/** Resend's shared test sender. It delivers only to the Resend account email. */
export const RESEND_TEST_FROM = "onboarding@resend.dev";

export function resendFrom(): string {
  return process.env.RESEND_FROM?.trim() || RESEND_TEST_FROM;
}

export function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}
