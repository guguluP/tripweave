import { cn } from "@/lib/utils";

/** Night-sea mark. Three shapes only so it stays sharp at header size. */
export function WeaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-10 shrink-0", className)}
      aria-hidden
    >
      <rect width="48" height="48" rx="12" fill="#073A42" />
      {/* flag */}
      <path d="M24 4.5v5" stroke="#F6E7B8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M24.7 4.8h6.2l-1.5 2 1.5 2H24.7V4.8z" fill="#F6E7B8" />
      {/* one solid temple */}
      <path
        fill="#E8C56A"
        d="M24 10c3.2 0 5.4 1.1 6.6 3.1 1.3 2.1 1.4 3.6.8 5.6-.9 3.2-2.6 4.6-3.4 7.6-.4 1.5-.4 2.6-.2 3.7h-7.6c.2-1.1.2-2.2-.2-3.7-.8-3-2.5-4.4-3.4-7.6-.6-2-.5-3.5.8-5.6C18.6 11.1 20.8 10 24 10z"
      />
      <path fill="#E8C56A" d="M18.8 30.2h10.4l1.8 5.2H17z" />
      <rect x="22.2" y="31.2" width="3.6" height="4" rx=".4" fill="#073A42" />
      {/* filled cyan wave — not a hairline */}
      <path
        fill="#3EE6DA"
        d="M6 38.2c6.4-4.8 12.4-4.8 18 0 5.6 4.8 11.6 4.8 18 0v4.6c-6.4 4.8-12.4 4.8-18 0-5.6-4.8-11.6-4.8-18 0z"
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
