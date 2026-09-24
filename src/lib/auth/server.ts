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
import { Pool } from "pg";
import { getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { sendPasswordResetEmail } from "./password-email";
import { supabaseAuthAdapter } from "./supabase-adapter";
import { isSupabaseAdminConfigured } from "../supabase/env";
import { gateIdentitySessions } from "./gate-session.server";
import { GROK_PROVIDERS } from "./providers";
import { pgliteDialect } from "./pglite-dialect";
import {
  GROK_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";

export const SESSION_TOKEN_COOKIE = "better-auth.session_token";

const hasGrokCreds = Boolean(
  process.env.GROK_AUTH_CLIENT_ID && process.env.GROK_AUTH_CLIENT_SECRET,
);
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  "";
const hasDb = Boolean(databaseUrl);
const onServerless = Boolean(process.env.VERCEL);

/** True only when a real DB or Grok OAuth creds exist.
 * Without DATABASE_URL, serverless cannot run PGLite — use cookie sessions. */
export const authConfigured = hasGrokCreds || hasDb || onServerless;

const explicitBaseURL =
  process.env.BETTER_AUTH_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : undefined);
const LOCAL_DEV_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];
const vercelOrigins = [
  "https://tripweave-web.vercel.app",
  "https://tripweave-web-piyushpatnaik.vercel.app",
  "https://*.vercel.app",
];

const trustedOrigins: string[] = explicitBaseURL
  ? [explicitBaseURL, ...LOCAL_DEV_ORIGINS, ...vercelOrigins]
  : [
      ...PREVIEW_ALLOWED_HOSTS.flatMap((h) => [`https://${h}`, `http://${h}`]),
      ...LOCAL_DEV_ORIGINS,
      ...vercelOrigins,
    ];

function getSecret(): string {
  return (
    process.env.BETTER_AUTH_SECRET ||
    process.env.GROK_AUTH_CLIENT_SECRET ||
    PREVIEW_CLIENT_SECRET
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleSocial =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined;
const grokIssuer = process.env.GROK_AUTH_ISSUER || GROK_ISSUER_DEFAULT;
const grokClientId = process.env.GROK_AUTH_CLIENT_ID || PREVIEW_CLIENT_ID;
const grokClientSecret = process.env.GROK_AUTH_CLIENT_SECRET || PREVIEW_CLIENT_SECRET;
const issuerBase = grokIssuer.replace(/\/+$/, "");

const grokOAuthPlugin =
  hasGrokCreds || true
    ? genericOAuth({
        config: GROK_PROVIDERS.map((p) => ({
          providerId: p.providerId,
          clientId: grokClientId,
          clientSecret: grokClientSecret,
          // Broker discovery lives at /api/auth/.well-known — not issuer root.
          // Static endpoints skip a 404 discovery fetch that surfaces as
          // "Invalid OAuth configuration".
          authorizationUrl: `${issuerBase}/api/auth/oauth2/authorize`,
          tokenUrl: `${issuerBase}/api/auth/oauth2/token`,
          userInfoUrl: `${issuerBase}/api/auth/oauth2/userinfo`,
          scopes: ["openid", "profile", "email"],
          authorizationUrlParams: { idp: p.idp, prompt: "login" },
        })),
      })
    : null;

export const auth = betterAuth({
  baseURL: explicitBaseURL || {
    allowedHosts: [
      ...PREVIEW_ALLOWED_HOSTS,
      "localhost",
      "127.0.0.1",
      "[::1]",
      "tripweave-web.vercel.app",
      "tripweave-web-piyushpatnaik.vercel.app",
      "*.vercel.app",
    ],
    protocol: "auto" as const,
    fallback: "http://localhost:8080",
  },
  secret: getSecret(),
  // Vercel does not use DATABASE_URL. A bad pooler password was 500ing
  // /api/auth/sign-in/social. Identity lives in Supabase ba_* tables instead,
  // so a password reset token is still there on the next request.
  ...(onServerless
    ? isSupabaseAdminConfigured()
      ? { database: supabaseAuthAdapter() }
      : {}
    : hasDb
      ? { database: new Pool({ connectionString: databaseUrl }) }
      : { database: pgliteDialect(() => getPglite()) }),
  trustedOrigins,
  emailAndPassword: emailAndPasswordEnabled
    ? {
        enabled: true,
        requireEmailVerification: false,
        sendResetPassword: async ({ user, url }) => {
          await sendPasswordResetEmail(user.email, url);
        },
      }
    : undefined,
  socialProviders: googleSocial,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: onServerless ? 60 * 60 * 24 * 7 : 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: Boolean(explicitBaseURL?.startsWith("https") || onServerless),
    cookiePrefix:
      explicitBaseURL?.startsWith("https") || onServerless ? "__Host-" : undefined,
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
