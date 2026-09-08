/**
 * DigiLocker requester integration
 * -------------------------------
 * Live issued-document pull needs organisation onboarding as a DigiLocker
 * Requester via API Setu (apisetu.gov.in). After approval you receive an
 * OAuth client id/secret. Until those env vars exist we run a labelled
 * sandbox that returns sample issued documents after consent + OTP.
 *
 * Env (server only):
 *   DIGILOCKER_CLIENT_ID
 *   DIGILOCKER_CLIENT_SECRET
 *   DIGILOCKER_REDIRECT_URI
 */

import type { Gender, IdType, IssuedDoc, Traveler } from "@/lib/travelers";
import { emptyTraveler } from "@/lib/travelers";

export const DIGILOCKER_STATUS = {
  live: false,
  reason:
    "Live DigiLocker pull needs Requester credentials from API Setu / MeitY partner onboarding.",
  portal: "https://apisetu.gov.in/digilocker",
  citizenApp: "https://www.digilocker.gov.in/",
  authorizeHint: "https://api.digitallocker.gov.in/public/oauth2/1/authorize",
} as const;

export const DIGILOCKER_DOC_OPTIONS = [
  { id: "aadhaar", label: "Aadhaar e-KYC", issuer: "UIDAI" },
  { id: "pan", label: "PAN", issuer: "Income Tax Department" },
  { id: "dl", label: "Driving licence", issuer: "Ministry of Road Transport" },
  { id: "passport", label: "Passport", issuer: "Ministry of External Affairs" },
] as const;

export type DigilockerDocId = (typeof DIGILOCKER_DOC_OPTIONS)[number]["id"];

export type SandboxProfile = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  aadhaarLast4: string;
  panMasked: string;
  dlMasked: string;
  passportMasked: string;
};

/** Clearly labelled sample identities for the sandbox — not live Aadhaar data. */
export const SANDBOX_PROFILES: SandboxProfile[] = [
  {
    fullName: "Priya Sharma",
    phone: "9876543210",
    email: "priya.sharma@example.com",
    dateOfBirth: "1994-06-15",
    gender: "female",
    nationality: "IN",
    aadhaarLast4: "4321",
    panMasked: "ABCDE1234F",
    dlMasked: "OD-14-20180012345",
    passportMasked: "J8123456",
  },
  {
    fullName: "Arjun Mehta",
    phone: "9811122233",
    email: "arjun.mehta@example.com",
    dateOfBirth: "1990-11-02",
    gender: "male",
    nationality: "IN",
    aadhaarLast4: "8802",
    panMasked: "BBBPK8802Q",
    dlMasked: "MH-01-20150098765",
    passportMasked: "N2099881",
  },
  {
    fullName: "Ananya Das",
    phone: "9937065412",
    email: "ananya.das@example.com",
    dateOfBirth: "1998-03-21",
    gender: "female",
    nationality: "IN",
    aadhaarLast4: "1176",
    panMasked: "CQDPD1176K",
    dlMasked: "OD-02-20210033421",
    passportMasked: "P5566109",
  },
];

export function sandboxProfileForIndex(index: number): SandboxProfile {
  return SANDBOX_PROFILES[index % SANDBOX_PROFILES.length]!;
}

export function issuedDocsFromProfile(
  profile: SandboxProfile,
  requested: DigilockerDocId[],
): IssuedDoc[] {
  const now = new Date().toISOString().slice(0, 10);
  const docs: IssuedDoc[] = [];
  if (requested.includes("aadhaar")) {
    docs.push({
      type: "aadhaar",
      label: "Aadhaar e-KYC",
      issuer: "UIDAI",
      idMasked: `XXXX-XXXX-${profile.aadhaarLast4}`,
      verifiedAt: now,
    });
  }
  if (requested.includes("pan")) {
    docs.push({
      type: "other",
      label: "PAN",
      issuer: "Income Tax Department",
      idMasked: profile.panMasked,
      verifiedAt: now,
    });
  }
  if (requested.includes("dl")) {
    docs.push({
      type: "dl",
      label: "Driving licence",
      issuer: "Ministry of Road Transport",
      idMasked: profile.dlMasked,
      verifiedAt: now,
    });
  }
  if (requested.includes("passport")) {
    docs.push({
      type: "passport",
      label: "Passport",
      issuer: "Ministry of External Affairs",
      idMasked: profile.passportMasked,
      verifiedAt: now,
    });
  }
  return docs;
}

export function travelerFromSandbox(
  profile: SandboxProfile,
  requested: DigilockerDocId[],
  live: boolean,
): Traveler {
  const docs = issuedDocsFromProfile(profile, requested);
  const preferPassport = requested.includes("passport") && !requested.includes("aadhaar");
  const idType: IdType = preferPassport ? "passport" : requested.includes("dl") && !requested.includes("aadhaar") ? "dl" : "aadhaar";
  const idNumber =
    idType === "passport"
      ? profile.passportMasked
      : idType === "dl"
        ? profile.dlMasked
        : `XXXX-XXXX-${profile.aadhaarLast4}`;
  return emptyTraveler({
    fullName: profile.fullName,
    phone: profile.phone,
    email: profile.email,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    nationality: profile.nationality,
    idType,
    idNumber,
    identitySource: live ? "digilocker" : "digilocker_demo",
    issuedDocs: docs,
  });
}

export function digilockerPartnerReady(): boolean {
  return Boolean(
    typeof process !== "undefined" &&
      process.env?.DIGILOCKER_CLIENT_ID?.trim() &&
      process.env?.DIGILOCKER_CLIENT_SECRET?.trim(),
  );
}
