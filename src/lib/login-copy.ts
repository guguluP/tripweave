/** Login page marketing assets / copy (kept tiny for remote updates). */
export const LOGIN_HERO = {
  src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  alt: "Puri beach coastline at dusk",
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
