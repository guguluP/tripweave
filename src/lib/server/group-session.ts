import { getRequest, setCookie } from "@tanstack/react-start/server";
import { hmacSha256Hex } from "@/lib/server/razorpay-hmac";

const COOKIE = "tw_group_member";
const MAX_AGE = 30 * 24 * 60 * 60;

function secret(): string {
  return process.env.BETTER_AUTH_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "";
}

export async function signMemberCookie(tripId: string, memberId: string) {
  const key = secret();
  if (!key) return;
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const body = `${tripId}.${memberId}.${exp}`;
  const sig = await hmacSha256Hex(key, body);
  setCookie(COOKIE, `${body}.${sig}`, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
  });
}

export async function memberIdFromCookie(tripId: string): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const raw = getRequest()?.headers.get("cookie") ?? "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]!);
  const parts = value.split(".");
  if (parts.length < 4) return null;
  const sig = parts.pop()!;
  const body = parts.join(".");
  const [cookieTrip, memberId, exp] = parts;
  if (cookieTrip !== tripId || !memberId || !exp) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const expected = await hmacSha256Hex(key, body);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? memberId : null;
}

export function requestIp(): string {
  const request = getRequest();
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "local";
}
