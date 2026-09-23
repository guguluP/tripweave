import { cn } from "@/lib/utils";

export function WeaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-10 shrink-0", className)}
      aria-hidden
    >
      <circle cx="32" cy="32" r="32" fill="#0B3D44" />

      {/* flag */}
      <path d="M32 6v7" stroke="#F3E4B6" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M32.8 6.4h8L38.6 9.2 40.8 12H32.8z" fill="#F3E4B6" />

      {/* kalasa */}
      <circle cx="32" cy="14.2" r="1.6" fill="#E8C56A" />
      {/* amalaka disc */}
      <ellipse cx="32" cy="17.2" rx="7" ry="2.1" fill="#E8C56A" />

      {/* rekha deul — stepped waist, not a vase */}
      <path
        fill="#E8C56A"
        d="M25 18.6h14
           l1.6 3.2H23.4z
           M23.2 21.8h17.6
           c.4 2.4-.6 4.6-2.2 7.4
           c-1.4 2.6-2.2 4.8-2.4 7.2H26.2
           c-.2-2.4-1-4.6-2.4-7.2
           c-1.6-2.8-2.6-5-2.2-7.4z"
      />

      {/* jagamohana in front */}
      <path fill="#F0D48A" d="M26 36.2h12l2.4 8.2H23.6z" />
      <path fill="#0B3D44" d="M29.6 38.2h4.8v6.2h-4.8z" />
      <path fill="#E8C56A" d="M28.4 35h7.2l1 1.4H27.4z" />

      {/* gold horizon */}
      <path
        d="M10 46c7-3 14-3 22 0s15 3 22 0"
        fill="none"
        stroke="#D4A017"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* sea */}
      <path
        fill="#3EE6DA"
        d="M8 50c8-5 16-5 24 0s16 5 24 0v8H8z"
      />
      <path
        d="M8 54c8-4 16-4 24 0s16 4 24 0"
        fill="none"
        stroke="#0B3D44"
        strokeWidth="1.4"
        opacity="0.25"
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
