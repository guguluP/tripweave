function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Stable public hold id. The raw id can be a confirmation code and must not
 * reach the browser. SHA-256 via Web Crypto so the trip page does not import
 * node:crypto. The first 24 hex chars match the previous server digest.
 */
export async function publicHoldId(raw: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return hex(digest).slice(0, 24);
}
