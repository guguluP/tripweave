/**
 * Request guards for /api/ask POST: JSON content type, same-origin Origin header, and a
 * body-size cap that is enforced while reading, before any JSON parsing.
 */

export const ASK_BODY_LIMIT = 8 * 1024;

export type GuardFailure = { status: 403 | 413 | 415 | 400; reason: string };

function originOf(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Origins this deployment answers on: the request's own origin and the configured auth URL. */
export function allowedOrigins(request: Request): Set<string> {
  const out = new Set<string>();
  const own = originOf(request.url);
  if (own) out.add(own);
  for (const value of [
    process.env.BETTER_AUTH_URL?.trim(),
    process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
      : undefined,
  ]) {
    const configured = originOf(value);
    if (configured) out.add(configured);
  }
  return out;
}

export function checkAskHeaders(request: Request): GuardFailure | null {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return { status: 415, reason: "unsupported_media_type" };
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins(request).has(origin)) return { status: 403, reason: "forbidden" };
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > ASK_BODY_LIMIT) return { status: 413, reason: "too_large" };
  return null;
}

/** Read at most `limit` bytes. Returns null when the body is larger. */
export async function readCappedText(request: Request, limit = ASK_BODY_LIMIT): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    size += step.value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(step.value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    all.set(chunk, at);
    at += chunk.byteLength;
  }
  return new TextDecoder().decode(all);
}
