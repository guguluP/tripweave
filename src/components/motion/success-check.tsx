import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SuccessCheck({
  active = true,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [state, setState] = useState<"out" | "in">("out");

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (path) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    }
    if (!active) {
      setState("out");
      return;
    }
    const id = requestAnimationFrame(() => setState("in"));
    return () => cancelAnimationFrame(id);
  }, [active]);

  return (
    <span
      className={cn("t-success-check", className)}
      data-state={state}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none">
        <path
          ref={pathRef}
          d="M12 24.5L20.5 33L36 15"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
