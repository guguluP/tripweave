/** Login page marketing assets / copy (kept tiny for remote updates). */
export const LOGIN_HERO = {
  src: "/puri-beach.jpg",
  alt: "Puri beach, Odisha",
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
