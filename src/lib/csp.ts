/**
 * Content-Security-Policy for TripWeave.
 * Razorpay checkout and Google OAuth load scripts from their own hosts;
 * those origins must be allowlisted on purpose (see README Security).
 */

export type CspOptions = {
  /** Dev Vite HMR / eval. Off in production builds. */
  allowUnsafeEval?: boolean;
  /** Extra script hosts (tests). */
  extraScriptSrc?: string[];
};

const RAZORPAY = [
  "https://checkout.razorpay.com",
  "https://api.razorpay.com",
  "https://cdn.razorpay.com",
];

const GOOGLE = [
  "https://accounts.google.com",
  "https://apis.google.com",
  "https://www.google.com",
  "https://www.gstatic.com",
];

/** Build a CSP header value. Pure — safe to unit-test. */
export function buildContentSecurityPolicy(opts: CspOptions = {}): string {
  const scriptSrc = [
    "'self'",
    ...RAZORPAY,
    ...GOOGLE,
    ...(opts.extraScriptSrc ?? []),
  ];
  if (opts.allowUnsafeEval) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
  } else {
    // Razorpay injects a small inline bootstrapping snippet.
    scriptSrc.push("'unsafe-inline'");
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'self'"],
    "form-action": ["'self'", ...RAZORPAY, ...GOOGLE],
    "script-src": [...scriptSrc, "https://va.vercel-scripts.com", "https://apis.mappls.com", "https://sdk.mappls.com"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://apis.mappls.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "media-src": ["'self'", "blob:", "https:"],
    "connect-src": [
      "'self'",
      ...RAZORPAY,
      ...GOOGLE,
      "https://*.supabase.co",
      "https://router.project-osrm.org",
      "https://www.youtube.com",
      "https://i.ytimg.com",
      "https://va.vercel-scripts.com",
      "https://vitals.vercel-insights.com",
      "https://apis.mappls.com",
      "https://sdk.mappls.com",
      "https://tiles.mappls.com",
    ],
    "frame-src": [
      "'self'",
      ...RAZORPAY,
      ...GOOGLE,
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://www.mappls.com",
      "https://mappls.com",
    ],
    "worker-src": ["'self'", "blob:"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

export function cspAllowsHost(policy: string, host: string): boolean {
  const needle = host.replace(/\/$/, "");
  return policy.split(";").some((part) => part.includes(needle));
}
