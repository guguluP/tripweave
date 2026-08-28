import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, readMs } from "@/lib/motion";

export function TextSwap({
  text,
  className,
  shimmer = false,
}: {
  text: string;
  className?: string;
  shimmer?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);
  const [phase, setPhase] = useState<"idle" | "exit" | "preenter">("idle");

  useEffect(() => {
    if (text === display) return;
    if (prefersReducedMotion()) {
      setDisplay(text);
      setPhase("idle");
      return;
    }
    setPhase("exit");
    const dur = readMs("--text-swap-dur", 150);
    const id = window.setTimeout(() => {
      setDisplay(text);
      setPhase("preenter");
    }, dur);
    return () => window.clearTimeout(id);
  }, [text, display]);

  useLayoutEffect(() => {
    if (phase !== "preenter") return;
    const el = ref.current;
    if (el) void el.offsetWidth;
    setPhase("idle");
  }, [phase]);

  return (
    <span
      ref={ref}
      className={cn(
        "t-text-swap",
        shimmer && "t-shimmer",
        phase === "exit" && "is-exit",
        phase === "preenter" && "is-enter-start",
        className,
      )}
      data-text={shimmer ? display : undefined}
    >
      {display}
    </span>
  );
}
