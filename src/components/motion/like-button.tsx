import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { toggleSaved, useIsSaved } from "@/lib/saved";
import { prefersReducedMotion, readCssNumber, readMs } from "@/lib/motion";

type Particle = {
  px: string;
  py: string;
  pdur: string;
  pdelay: string;
  pEndScale: number;
  psize: number;
};

function spray(): Particle[] {
  const dist = readCssNumber("--like-particle-dist", 20);
  return Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.55;
    const d = dist * (0.75 + Math.random() * 0.5);
    return {
      px: `${Math.cos(angle) * d}px`,
      py: `${Math.sin(angle) * d}px`,
      pdur: `${500 + Math.random() * 180}ms`,
      pdelay: `${Math.random() * 50}ms`,
      pEndScale: 0.4 + Math.random() * 0.35,
      psize: 0.7 + Math.random() * 0.7,
    };
  });
}

export function LikeButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const liked = useIsSaved(id);
  const [bursting, setBursting] = useState(false);
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: 8 }, () => ({
      px: "0px",
      py: "0px",
      pdur: "600ms",
      pdelay: "0ms",
      pEndScale: 0.6,
      psize: 1,
    })),
  );

  return (
    <button
      type="button"
      className={cn("t-like", bursting && "is-bursting", className)}
      data-liked={liked ? "true" : "false"}
      aria-pressed={liked}
      aria-label={liked ? "Remove from saved" : "Save stay"}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = toggleSaved(id);
        if (next && !prefersReducedMotion()) {
          setParticles(spray());
          setBursting(true);
          window.setTimeout(() => setBursting(false), readMs("--like-particle-dur", 600) + 80);
        }
      }}
    >
      <span className="t-like-icon">
        <svg className="t-like-heart" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 20s-7-4.4-9.2-8.2C1.2 9.2 2.4 6 5.6 6c1.9 0 3.1 1.1 3.9 2.2C10.3 7.1 11.5 6 13.4 6c3.2 0 4.4 3.2 2.8 5.8C14 15.6 12 20 12 20z"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="t-like-particles" aria-hidden>
        {particles.map((p, i) => (
          <i
            key={i}
            style={
              {
                "--px": p.px,
                "--py": p.py,
                "--pdur": p.pdur,
                "--pdelay": p.pdelay,
                "--p-end-scale": p.pEndScale,
                "--psize": p.psize,
              } as CSSProperties
            }
          />
        ))}
      </span>
    </button>
  );
}
