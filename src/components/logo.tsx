import { cn } from "@/lib/utils";

/** Concept 4 — night-sea Puri mark. */
export function WeaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("size-10 shrink-0", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="tw-bg" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#0E5A63" />
          <stop offset="100%" stopColor="#052328" />
        </radialGradient>
        <linearGradient id="tw-gold" x1="40" y1="8" x2="40" y2="54">
          <stop offset="0%" stopColor="#F7E7B4" />
          <stop offset="55%" stopColor="#E0C36A" />
          <stop offset="100%" stopColor="#C49A3C" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#tw-bg)" />
      <path d="M40 7.5v8" stroke="#F7E7B4" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M40.7 8h7.4l-1.7 2.4 1.7 2.4H40.7z" fill="#F7E7B4" />
      <circle cx="40" cy="16.4" r="1.5" fill="url(#tw-gold)" />
      <ellipse cx="40" cy="20.6" rx="8.2" ry="1.5" fill="url(#tw-gold)" />
      <path
        fill="url(#tw-gold)"
        d="M40 21C47.2 21 50.6 25.5 50.2 31.2C49.7 37.4 46.8 41.2 45.4 47.6C44.8 50.4 44.6 52.2 44.8 54.2H35.2C35.4 52.2 35.2 50.4 34.6 47.6C33.2 41.2 30.3 37.4 29.8 31.2C29.4 25.5 32.8 21 40 21Z"
      />
      <path fill="url(#tw-gold)" d="M35.6 51.4h8.8l1.3 2.8H34.3z" />
      <rect x="37.6" y="52.4" width="4.8" height="3.6" rx="0.4" fill="#052328" />
      <path
        d="M14 58.5c8.5-3.2 17.2-3.2 26 0 8.8 3.2 17.5 3.2 26 0"
        fill="none"
        stroke="#D4A24A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 65c9.5-5.4 18.8-5.4 28 0 9.2 5.4 18.5 5.4 28 0"
        fill="none"
        stroke="#5CF6EA"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Same font as Trip / eave. Left half teal, right half saffron. */
function WovenW({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-grid leading-none", className)} aria-hidden>
      <span className="col-start-1 row-start-1 text-[#1F8A86]" style={{ clipPath: "inset(0 50% 0 0)" }}>
        W
      </span>
      <span className="col-start-1 row-start-1 text-[#D97706]" style={{ clipPath: "inset(0 0 0 50%)" }}>
        W
      </span>
    </span>
  );
}

export function BrandWord({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-lg font-semibold tracking-tight text-[#12343C]",
        className,
      )}
    >
      Trip
      <WovenW />
      eave
    </span>
  );
}

export function BrandLockup({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <WeaveMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <BrandWord />
        <span className="mt-0.5 hidden text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted sm:block">
          Puri stays
        </span>
      </span>
    </span>
  );
}
