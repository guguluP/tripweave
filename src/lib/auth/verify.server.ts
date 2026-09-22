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

export type VerifiedUser = { id: string; email: string | null };

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
    return { id: session.user.id, email: session.user.email ?? null };
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
