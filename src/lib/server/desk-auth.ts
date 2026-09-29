/**
 * Per-property desk tokens and signed accept/decline links.
 * Do NOT use PARTNER_EMAILS email:* wildcards for desk access.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type DeskTokenGrant = { packageId: string; token: string };

/** TW_DESK_TOKENS=packageId:secret,other-id:other-secret */
export function parseDeskTokens(raw = process.env.TW_DESK_TOKENS ?? ""): DeskTokenGrant[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx <= 0) return null;
      const packageId = entry.slice(0, idx).trim();
      const token = entry.slice(idx + 1).trim();
      if (!packageId || !token) return null;
      return { packageId, token };
    })
    .filter((g): g is DeskTokenGrant => Boolean(g));
}

export function packageIdsForDeskToken(token: string): string[] {
  const normalized = token.trim();
  if (!normalized) return [];
  return parseDeskTokens()
    .filter((g) => safeEqual(g.token, normalized))
    .map((g) => g.packageId);
}

export function assertDeskTokenForPackage(token: string, packageId: string): boolean {
  return packageIdsForDeskToken(token).includes(packageId);
}

/** Constant-time string compare. Hashing first keeps the compare length-independent. */
function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

function actionSecret(): string {
  return (
    process.env.TW_DESK_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

export function deskSigningReady(): boolean {
  return Boolean(actionSecret());
}

export type DeskActionPayload = {
  bookingId: number;
  packageId: string;
  confirmationCode: string;
  action: "accept" | "decline";
  exp: number;
};

function b64url(buf: Buffer | string) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signDeskAction(input: Omit<DeskActionPayload, "exp"> & { ttlSec?: number }): string | null {
  const secret = actionSecret();
  if (!secret) return null;
  const payload: DeskActionPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSec ?? 60 * 60 * 48),
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyDeskAction(token: string): DeskActionPayload | null {
  const secret = actionSecret();
  if (!secret || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(createHmac("sha256", secret).update(body).digest());
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as DeskActionPayload;
    if (!payload?.bookingId || !payload.packageId || !payload.action) return null;
    if (payload.action !== "accept" && payload.action !== "decline") return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function appBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.VITE_APP_URL?.trim() ||
    "https://tripweave-web.vercel.app"
  ).replace(/\/$/, "");
}

export function deskActionUrl(token: string): string {
  return `${appBaseUrl()}/desk/action?t=${encodeURIComponent(token)}`;
}

export function deskPortalUrl(packageId: string, token: string): string {
  return `${appBaseUrl()}/desk?packageId=${encodeURIComponent(packageId)}&token=${encodeURIComponent(token)}`;
}
