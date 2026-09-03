/**
 * DigiLocker integration notes
 * ----------------------------
 * Live document fetch requires organisation onboarding as a DigiLocker *Requester*
 * via API Setu (apisetu.gov.in) — OAuth client id/secret issued after approval.
 * Third-party KYC gateways (Sandbox, etc.) also need paid API keys.
 *
 * Until credentials exist, we offer:
 *  1. Clear UX for “Connect DigiLocker” with partner-status messaging
 *  2. Demo autofill of Aadhaar-style identity (for product testing)
 *  3. Deep link to digilocker.gov.in for users to manage their locker
 */

export const DIGILOCKER_STATUS = {
  live: false,
  reason:
    "Live DigiLocker pull needs Requester credentials from API Setu / MeitY partner onboarding.",
  portal: "https://apisetu.gov.in/digilocker",
  citizenApp: "https://www.digilocker.gov.in/",
} as const;

export function digilockerPartnerReady(): boolean {
  return Boolean(
    typeof process !== "undefined" &&
      process.env?.DIGILOCKER_CLIENT_ID?.trim() &&
      process.env?.DIGILOCKER_CLIENT_SECRET?.trim(),
  );
}
