import { createHmac } from "node:crypto";

/** HMAC-SHA256 hex digest. Server-only so checkout does not pull node:crypto. */
export function hmacSha256Hex(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
