/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Pre-wired for live preview + deploy — do not rewrite this file. To enable
 * local email/password, flip the flag in `./email-password` only (see auth skill).
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie stays
 * on this app's own origin. Sign-in federates to the shared **Grok auth broker**
 * (`GROK_AUTH_ISSUER`) via the `genericOAuth` plugin — the broker brokers the
 * upstream sign-in methods (Google, X, …) and holds their shared secrets; this
 * app only holds its own client id/secret and names the upstream it wants via
 * each provider's `idp` hint.
 *
 * Tri-mode:
 *   - Deployed: the deployer injects a per-app `GROK_AUTH_*` + `BETTER_AUTH_URL`
 *     + `DATABASE_URL`, so real federated auth is persisted in Postgres.
 *   - Sandbox live preview: no injection -> falls back to the shared **preview
 *     client** (`./preview`) and derives the preview's `https://*.grok-sandbox.com`
 *     origin from the request, so real sign-in works (no demo users). Sessions
 *     and identities persist in the embedded PGLite DB (same DB as app data);
 *     the process restart wipes both. Live-preview iframe clients use a bearer
 *     token (partitioned cookies) — see `client.ts`.
 *   - Off (`VITE_AUTH_ENABLED=false`, the shipped default): no providers;
 *     `requireUserId` resolves a dev user with no database configured, and
 *     throws fail-closed once `DATABASE_URL` is set (see `verify.server.ts`).
 *
 * NEVER import this from client code — it pulls in `pg` + the preview secret +
 * server-only Better Auth internals. The client uses `@/lib/auth/client`;
 * components read the user via `@/lib/auth/use-current-user`; server functions get
 * a verified id via `@/lib/auth/middleware`.
 */
import { betterAuth } from "better-auth";
import { bearer, genericOAuth } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { GATE_PROVIDER_ID, gateIdentitySessions } from "./gate-session.server";
import { GROK_PROVIDERS } from "./providers";
import { pgliteDialect } from "./pglite-dialect";
import {
  GROK_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";

const SESSION_TOKEN_COOKIE = "better-auth.session_token";

/** True when real auth credentials (or preview fallback) are present. */
export const authConfigured =
  Boolean(process.env.GROK_AUTH_CLIENT_ID && process.env.GROK_AUTH_CLIENT_SECRET) ||
  Boolean(process.env.DATABASE_URL) ||
  true; // preview always available as fallback

function getBaseURL(request?: Request): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://localhost:8080";
}

function getSecret(): string {
  return process.env.BETTER_AUTH_SECRET || process.env.GROK_AUTH_CLIENT_SECRET || randomBytes(32).toString("hex");
}

const grokOAuthPlugin = authConfigured
  ? genericOAuth({
      config: GROK_PROVIDERS.map((p) => ({
        providerId: p.providerId,
        discoveryUrl: `${process.env.GROK_AUTH_ISSUER || GROK_ISSUER_DEFAULT}/.well-known/openid-configuration`,
        clientId: process.env.GROK_AUTH_CLIENT_ID || PREVIEW_CLIENT_ID,
        clientSecret: process.env.GROK_AUTH_CLIENT_SECRET || PREVIEW_CLIENT_SECRET,
        scopes: ["openid", "profile", "email"],
        // Hint the broker which upstream identity provider to use.
        authorizationUrlParams: { idp: p.idp },
      })),
    })
  : undefined;

export const auth = betterAuth({
  baseURL: getBaseURL(),
  secret: getSecret(),
  database: process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : pgliteDialect(getPglite()),
  emailAndPassword: emailAndPasswordEnabled
    ? {
        enabled: true,
        requireEmailVerification: false,
      }
    : undefined,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    // On local http:// the __Host- prefix is dropped by browsers; only use it
    // when we know we are on HTTPS (deployed or preview).
    useSecureCookies: Boolean(process.env.BETTER_AUTH_URL?.startsWith("https")),
    cookiePrefix: process.env.BETTER_AUTH_URL?.startsWith("https") ? "__Host-" : undefined,
  },
  plugins: [
    // Identity gate sessions (preview / local identity isolation).
    gateIdentitySessions(),

    // Optional OAuth federation through the Grok auth broker.
    ...(grokOAuthPlugin ? [grokOAuthPlugin] : []),

    // Bearer token support for live-preview iframe clients that cannot rely on
    // a cookie. Needed for the LIVE PREVIEW: the app runs in an embedded iframe
    // where cookies are partitioned, so after popup sign-in it authenticates with
    // a bearer token instead (see `client.ts` / the `auth` skill). The hook only
    // fires when an Authorization header is present, so the cookie path
    // (deployed apps) is unaffected.
    bearer(),

    // Bridges Better Auth's Set-Cookie into TanStack Start responses. MUST be
    // last so it runs after every other plugin's hooks.
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

// Re-exported for convenience; the array lives in the dependency-free
// `providers.ts` so the client can import it too.
export { GROK_PROVIDERS } from "./providers";
