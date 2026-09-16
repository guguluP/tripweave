import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Pure digit strings may animate per glyph; currency / trust labels stay whole. */
function shouldSplitPerGlyph(text: string) {
  return /^\d+$/.test(text);
}

export function DigitPop({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const text = String(value);
  const split = shouldSplitPerGlyph(text);
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

  // Formatted INR (₹6,200), trust "90/100", confirmation codes with letters, etc.
  // must stay one accessible string — screen readers and layout both break if
  // we split currency symbols / separators / slashes per glyph.
  if (!split) {
    return (
      <span
        className={cn("t-digit-group tabular-nums", animating && "is-animating", className)}
        aria-label={text}
      >
        <span className="t-digit">{text}</span>
      </span>
    );
  }

  return (
    <span
      className={cn("t-digit-group tabular-nums", animating && "is-animating", className)}
      aria-label={text}
    >
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
