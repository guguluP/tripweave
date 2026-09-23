import { cn } from "@/lib/utils";

/** Night-sea Puri mark: gold shikhara, saffron thread, teal wave. */
export function WeaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="tw-sea" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0B4A52" />
          <stop offset="1" stopColor="#062830" />
        </linearGradient>
        <linearGradient id="tw-gold" x1="16" y1="4" x2="16" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F3E2B8" />
          <stop offset="1" stopColor="#C9A24A" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#tw-sea)" />
      {/* flag */}
      <path d="M16.2 5.2h.01" stroke="#F3E2B8" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M16.2 4.4v2.4" stroke="#F3E2B8" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M16.4 4.5h3.1l-0.7 1.05 0.7 1.05H16.4V4.5z" fill="#E8D5A3" />
      {/* amalaka + kalasa */}
      <ellipse cx="16" cy="7.6" rx="2.1" ry="0.7" fill="url(#tw-gold)" />
      <path d="M13.2 8.1c0-1.1 1.25-1.7 2.8-1.7s2.8.6 2.8 1.7" fill="url(#tw-gold)" />
      {/* shikhara */}
      <path
        d="M11.4 10.2c1.1-1.6 2.4-2.6 4.6-2.6s3.5 1 4.6 2.6c.7 1 .9 1.6.7 2.4-.4 1.6-1.6 2.4-2.4 4.4-.4 1-.5 1.8-.4 2.6H13.5c.1-.8 0-1.6-.4-2.6-.8-2-2-2.8-2.4-4.4-.2-.8 0-1.4.7-2.4z"
        fill="url(#tw-gold)"
      />
      {/* jagamohana */}
      <path d="M13.2 19.2h5.6l.8 2.2h-7.2l.8-2.2z" fill="url(#tw-gold)" />
      <path d="M14.3 19.6h3.4v1.4H14.3z" fill="#062830" opacity="0.35" />
      <rect x="15.2" y="19.8" width="1.6" height="1.6" rx="0.2" fill="#062830" opacity="0.45" />
      {/* saffron thread over the tide */}
      <path
        d="M6 22.2c4.2-1.6 7.4-.2 10 .6 2.8.9 5.4 1.2 10-0.4"
        fill="none"
        stroke="#D97706"
        strokeWidth="0.85"
        strokeLinecap="round"
      />
      {/* teal wave */}
      <path
        d="M4.5 24.6c3.6-2.2 6.8-1 9.8.2 3.2 1.3 6.2 1.6 13.2-0.6"
        fill="none"
        stroke="#2EE0D0"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M5 27.2c4-1.6 8-.4 11.2.3 3.4.8 6.6.6 11-.8"
        fill="none"
        stroke="#1AA8A0"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function BrandWord({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-semibold tracking-tight", className)}>
      TripWeave
    </span>
  );
}
