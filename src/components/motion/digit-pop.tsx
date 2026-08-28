import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function DigitPop({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const text = String(value);
  const [animating, setAnimating] = useState(false);
  const first = useRef(true);

  useLayoutEffect(() => {
    setAnimating(false);
    const id = requestAnimationFrame(() => {
      setAnimating(true);
      first.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [text]);

  return (
    <span className={cn("t-digit-group tabular-nums", animating && "is-animating", className)}>
      {text.split("").map((ch, i) => (
        <span
          key={`${i}-${ch}-${text}`}
          className="t-digit"
          data-stagger={i === 0 ? undefined : String(Math.min(i, 8))}
        >
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
}
