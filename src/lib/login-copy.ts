/** Login page marketing assets / copy (kept tiny for remote updates). */
export const LOGIN_HERO = {
  src: "/cover/puri.jpg",
  alt: "Puri beach",
} as const;

export function loginCheckoutPrompt(verb: "hold" | "confirm" = "confirm") {
  return verb === "confirm"
    ? "Sign in to pay and confirm this booking."
    : "Sign in to pay and hold this stay.";
}

export function loginCheckoutBody(verb: "hold" | "confirm" = "confirm") {
  return verb === "confirm"
    ? "Use Google or your email to pay and confirm this booking."
    : "Use Google or your email to pay and hold this stay.";
}

export const HAS_ACCOUNT_KEY = "tw-has-account";

/** New visitors sign up. A flag from a previous success defaults to sign in. */
export function initialMode(hasAccountFlag: boolean): "in" | "up" {
  return hasAccountFlag ? "in" : "up";
}

export function nextCopy(path: string, stay?: { name?: string; nights?: number } | null): string {
  if (path.startsWith("/checkout") || path.startsWith("/travelers")) {
    const name = stay?.name?.trim() || "this stay";
    const nights = stay?.nights && stay.nights > 0 ? stay.nights : 0;
    const nightLabel = nights === 1 ? "1 night" : nights > 1 ? `${nights} nights` : "";
    const what = nightLabel ? `${name} · ${nightLabel}` : name;
    return `Create an account to book ${what}. Your room is held once you continue.`;
  }
  if (path.startsWith("/account") || path.startsWith("/trips")) return "Sign in to see your trips.";
  return "Sign in with Google or your email.";
}
