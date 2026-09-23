import { cn } from "@/lib/utils";

const MARK_ID = "tw-mark";

/** Night-sea Puri mark — gold shikhara over a cyan wave (concept 4). */
export function WeaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-9 shrink-0 rounded-xl shadow-sm", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${MARK_ID}-sea`} x1="32" y1="0" x2="32" y2="64">
          <stop offset="0" stopColor="#0A5560" />
          <stop offset="0.55" stopColor="#073A42" />
          <stop offset="1" stopColor="#041E24" />
        </linearGradient>
        <linearGradient id={`${MARK_ID}-gold`} x1="32" y1="6" x2="32" y2="42">
          <stop offset="0" stopColor="#F8EBC4" />
          <stop offset="0.45" stopColor="#E4C77A" />
          <stop offset="1" stopColor="#C9A24A" />
        </linearGradient>
        <radialGradient id={`${MARK_ID}-glow`} cx="32" cy="50" r="22">
          <stop offset="0" stopColor="#3EF0E4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3EF0E4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" rx="14" fill={`url(#${MARK_ID}-sea)`} />
      <rect width="64" height="64" rx="14" fill={`url(#${MARK_ID}-glow)`} />

      {/* flagpole + flag */}
      <path d="M32 5.2v6.2" stroke="#F8EBC4" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M32.6 5.6h7.2l-1.6 2.2 1.6 2.2H32.6V5.6z" fill="#F3E2B0" />

      {/* kalasa + amalaka ring */}
      <circle cx="32" cy="12.2" r="1.15" fill={`url(#${MARK_ID}-gold)`} />
      <ellipse cx="32" cy="14.6" rx="5.2" ry="1.35" fill={`url(#${MARK_ID}-gold)`} />
      <path
        d="M26.4 16.2c0-1.7 2.5-2.6 5.6-2.6s5.6.9 5.6 2.6"
        fill={`url(#${MARK_ID}-gold)`}
      />
      {/* colonnade under amalaka */}
      {[27.2, 29.6, 32, 34.4, 36.8].map((x) => (
        <rect key={x} x={x - 0.45} y="16.1" width="0.9" height="2.4" rx="0.3" fill="#F8EBC4" opacity="0.85" />
      ))}

      {/* curved Odishan deul */}
      <path
        d="M22.8 20.4c2.2-3.4 4.8-5.6 9.2-5.6s7 2.2 9.2 5.6c1.3 2 1.7 3.3 1.3 4.9-.8 3.2-3.2 4.6-4.6 8.6-.8 2.2-1 3.8-.8 5.3H27c.2-1.5 0-3.1-.8-5.3-1.4-4-3.8-5.4-4.6-8.6-.4-1.6 0-2.9 1.2-4.9z"
        fill={`url(#${MARK_ID}-gold)`}
      />
      {/* vertical ribs */}
      <path
        d="M32 15.2v23.6 M28.4 18.4c-.2 6.4.2 13.2.6 20.2 M35.6 18.4c.2 6.4-.2 13.2-.6 20.2"
        fill="none"
        stroke="#F8EBC4"
        strokeWidth="0.45"
        opacity="0.35"
      />

      {/* jagamohana */}
      <path d="M27.2 38.6h9.6l1.5 4.6H25.7l1.5-4.6z" fill={`url(#${MARK_ID}-gold)`} />
      <path d="M29.4 36.4h5.2l.8 2.2h-6.8z" fill={`url(#${MARK_ID}-gold)`} />
      <path d="M31.2 36.8h1.6v1.2h-1.6z" fill="#073A42" opacity="0.35" />
      <rect x="30.4" y="39.2" width="3.2" height="4" rx="0.35" fill="#041E24" opacity="0.55" />

      {/* gold tide line through the plinth */}
      <path
        d="M8 43.6c8-2.8 16.4-1.2 24 .4 8.2 1.7 16.2 1.4 24-1.6"
        fill="none"
        stroke="#E8B86A"
        strokeWidth="1.15"
        strokeLinecap="round"
      />

      {/* luminous cyan wave */}
      <path
        d="M7 49.2c7.4-4.6 14.2-2.2 20.4.4 7 2.8 13.6 3.4 30-1.8"
        fill="none"
        stroke="#5CF6EA"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M9 53.8c8-3.2 16.2-1 24 .6 8.4 1.7 15.6.8 22-2.4"
        fill="none"
        stroke="#1AA8A0"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
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
