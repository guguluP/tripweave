import type { AppUser } from "@/lib/auth/use-current-user";

/** Demo-guest leftover from older TripWeave builds — not a real session. */
export function isRealUser(user: AppUser | null | undefined): user is AppUser {
  return Boolean(user && user.id !== "demo-user");
}
