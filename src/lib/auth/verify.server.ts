import { getRequest } from "@tanstack/react-start/server";
import { gateIdentityEnabled } from "./gate-identity.server";
import { auth, authConfigured } from "./server";

const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

export { authConfigured };

if (databaseConfigured && !authConfigured) {
  console.error(
    "[auth] DATABASE_URL is set but auth is disabled — requireUserId() will reject.",
  );
}

export const DEV_USER_ID = "dev-user";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedUser = {
  id: string;
  email: string | null;
  /** Set when tw_claim_subject failed after retry — booking lists must not pretend the account is empty. */
  claimFailed?: boolean;
};

export async function getSessionUser(
  bearerToken?: string,
): Promise<VerifiedUser | null> {
  const request = getRequest();
  if (!authConfigured && !gateIdentityEnabled()) {
    return null;
  }
  if (!request) return null;
  let headers = request.headers;
  if (bearerToken) {
    headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }
  try {
    const session = await auth.api.getSession({ headers });
    if (!session?.user) return null;
    const { claimStableUserId, ClaimSubjectError } = await import(
      "@/lib/server/account-subject"
    );
    try {
      const id = await claimStableUserId(session.user.id, session.user.email);
      return { id, email: session.user.email ?? null };
    } catch (err) {
      if (err instanceof ClaimSubjectError) {
        // Stay signed in, but flag booking-read paths so My trips shows an error
        // instead of an empty list under a fresh session id.
        console.error("[auth] claim subject failed closed", err.message);
        return {
          id: session.user.id,
          email: session.user.email ?? null,
          claimFailed: true,
        };
      }
      throw err;
    }
  } catch (err) {
    console.error("[auth] getSession failed", err);
    return null;
  }
}

export async function requireUserId(bearerToken?: string): Promise<string> {
  if (!authConfigured && !gateIdentityEnabled()) {
    throw new UnauthorizedError();
  }
  const user = await getSessionUser(bearerToken);
  if (!user) throw new UnauthorizedError();
  return user.id;
}
