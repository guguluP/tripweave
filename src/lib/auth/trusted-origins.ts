/**
 * Origins Better Auth trusts for callbackURL, redirectTo and the Origin check.
 *
 * Never a "*.vercel.app" wildcard: anyone can deploy to vercel.app, and a trusted
 * redirectTo on a password reset sends the reset token to that site.
 * Each Vercel deployment trusts its own URL and branch URL instead.
 */
const FIXED = ["https://tripweave-web.vercel.app", "https://tripweave-web-piyushpatnaik.vercel.app"];

function hostOf(raw: string | undefined): string | null {
  const host = raw?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
  if (!host || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null;
  return host;
}

export function vercelTrustedOrigins(env: Record<string, string | undefined>): string[] {
  const out = [...FIXED];
  for (const key of ["VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"]) {
    const host = hostOf(env[key]);
    if (host) out.push(`https://${host}`);
  }
  return [...new Set(out)];
}
