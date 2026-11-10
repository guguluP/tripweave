/**
 * Deployed CSP header. Nitro auto-registers server/middleware/*.
 * Allowlists Razorpay + Google (see src/lib/csp.ts).
 */
import { buildContentSecurityPolicy } from "../../src/lib/csp";

interface CspEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

export default async function cspMiddleware(
  event: CspEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  const policy = buildContentSecurityPolicy({
    allowUnsafeEval: process.env.NODE_ENV !== "production",
  });

  if (result instanceof Response) {
    const headers = new Headers(result.headers);
    if (!headers.has("content-security-policy")) {
      headers.set("content-security-policy", policy);
    }
    if (!headers.has("x-content-type-options")) headers.set("x-content-type-options", "nosniff");
    // Group share links carry their token in the path. Never send the path to other sites.
    if (!headers.has("referrer-policy")) headers.set("referrer-policy", "strict-origin-when-cross-origin");
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  }

  return result;
}
