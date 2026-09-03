/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Pre-wired for live preview + deploy — do not rewrite this file. To enable
 * local email/password, flip the flag in `./email-password` only (see auth skill).
 */
import { betterAuth } from "better-auth";
import { bearer, genericOAuth } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { gateIdentitySessions } from "./gate-session.server";
import { GROK_PROVIDERS } from "./providers";
import { pgliteDialect } from "./pglite-dialect";
import {
  GROK_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";

const SESSION_TOKEN_COOKIE = "better-auth.session_token";

const hasGrokCreds = Boolean(
  process.env.GROK_AUTH_CLIENT_ID && process.env.GROK_AUTH_CLIENT_SECRET,
);
const hasDb = Boolean(process.env.DATABASE_URL?.trim());

/** True when federated sign-in or local email/password can run. */
export const authConfigured = hasGrokCreds || hasDb || emailAndPasswordEnabled;

const explicitBaseURL = process.env.BETTER_AUTH_URL?.trim() || undefined;
const LOCAL_DEV_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

const trustedOrigins: string[] = explicitBaseURL
  ? [
      explicitBaseURL,
      ...LOCAL_DEV_ORIGINS,
      // Common Vercel aliases for this project
      "https://tripweave-web.vercel.app",
      "https://tripweave-web-piyushpatnaik.vercel.app",
    ]
  : [
      ...PREVIEW_ALLOWED_HOSTS.flatMap((h) => [`https://${h}`, `http://${h}`]),
      ...LOCAL_DEV_ORIGINS,
      "https://tripweave-web.vercel.app",
      "https://tripweave-web-piyushpatnaik.vercel.app",
    ];

function getSecret(): string {
  return (
    process.env.BETTER_AUTH_SECRET ||
    process.env.GROK_AUTH_CLIENT_SECRET ||
    randomBytes(32).toString("hex")
  );
}

const grokIssuer = process.env.GROK_AUTH_ISSUER || GROK_ISSUER_DEFAULT;
const grokClientId = process.env.GROK_AUTH_CLIENT_ID || PREVIEW_CLIENT_ID;
const grokClientSecret = process.env.GROK_AUTH_CLIENT_SECRET || PREVIEW_CLIENT_SECRET;

const grokOAuthPlugin =
  hasGrokCreds || true
    ? genericOAuth({
        config: GROK_PROVIDERS.map((p) => ({
          providerId: p.providerId,
          discoveryUrl: `${grokIssuer}/.well-known/openid-configuration`,
          clientId: grokClientId,
          clientSecret: grokClientSecret,
          scopes: ["openid", "profile", "email"],
          authorizationUrlParams: { idp: p.idp, prompt: "login" },
        })),
      })
    : null;

export const auth = betterAuth({
  baseURL: explicitBaseURL || {
    allowedHosts: [...PREVIEW_ALLOWED_HOSTS, "localhost", "127.0.0.1", "[::1]", "tripweave-web.vercel.app", "tripweave-web-piyushpatnaik.vercel.app"],
    protocol: "auto" as const,
    fallback: "http://localhost:8080",
  },
  secret: getSecret(),
  database: hasDb
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : pgliteDialect(getPglite()),
  trustedOrigins,
  emailAndPassword: emailAndPasswordEnabled
    ? {
        enabled: true,
        requireEmailVerification: false,
      }
    : undefined,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: Boolean(explicitBaseURL?.startsWith("https")),
    // Prefer plain cookie names on http; __Host- only on https
    cookiePrefix: explicitBaseURL?.startsWith("https") ? "__Host-" : undefined,
  },
  plugins: [
    gateIdentitySessions(),
    ...(grokOAuthPlugin ? [grokOAuthPlugin] : []),
    bearer(),
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

export { GROK_PROVIDERS } from "./providers";
