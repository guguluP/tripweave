import { useEffect, useRef, useState, type ComponentProps } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { bezierEasing, prefersReducedMotion, readCssNumber, readMs } from "@/lib/motion";

function measureWords(text: string, font: string, originX: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [] as { center: number; width: number }[];
  ctx.font = font;
  const parts = text.split(/(\s+)/);
  let x = originX;
  const out: { center: number; width: number }[] = [];
  for (const part of parts) {
    const w = ctx.measureText(part).width;
    if (part.trim()) out.push({ center: x + w / 2, width: w });
    x += w;
  }
  return out;
}

export function ClearInput({
  value,
  onValueChange,
  placeholder = "Search",
  className,
  ...inputProps
}: {
  value: string;
  onValueChange: (next: string) => void;
  placeholder?: string;
} & Omit<ComponentProps<"input">, "value" | "onChange">) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const phRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [clearing, setClearing] = useState(false);
  const [mirror, setMirror] = useState(value);

  useEffect(() => {
    if (!clearing) setMirror(value);
  }, [value, clearing]);

  const runClear = () => {
    if (!value || clearing) return;
    setMirror(value);
    if (prefersReducedMotion()) {
      onValueChange("");
      return;
    }
    const wrap = wrapRef.current;
    const mirrorEl = mirrorRef.current;
    const ph = phRef.current;
    const glow = glowRef.current;
    if (!wrap || !mirrorEl || !ph || !glow) {
      onValueChange("");
      return;
    }

    const dur = readMs("--clear-dur", 1000);
    const outDur = readMs("--clear-out-dur", 400);
    const inDur = readMs("--clear-in-dur", 400);
    const outFly = readCssNumber("--clear-out-fly", 12);
    const inFly = readCssNumber("--clear-in-fly", 12);
    const blur = readCssNumber("--clear-blur", 2);
    const glowDelay = readMs("--glow-delay", 50);
    const glowPeakAt = readCssNumber("--glow-peak-at", 0.15);
    const glowOpacity = readCssNumber("--glow-opacity", 0.85);
    const glowSpread = readCssNumber("--glow-spread", 1.5);
    const ease = bezierEasing(0.22, 1, 0.36, 1);
    const font = getComputedStyle(mirrorEl).font;
    const words = measureWords(value, font, 12);

    setClearing(true);
    onValueChange("");
    ph.style.opacity = "0";
    ph.style.transform = `translateY(${inFly}px)`;
    ph.style.filter = `blur(${blur}px)`;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / dur);
      const outT = ease(Math.min(1, elapsed / outDur));
      const inT = ease(Math.min(1, Math.max(0, (elapsed - 70) / inDur)));

      mirrorEl.style.transform = `translateY(${-outFly * outT}px)`;
      mirrorEl.style.opacity = String(1 - outT);
      mirrorEl.style.filter = `blur(${blur * outT}px)`;

      ph.style.transform = `translateY(${inFly * (1 - inT)}px)`;
      ph.style.opacity = String(inT);
      ph.style.filter = `blur(${blur * (1 - inT)}px)`;

      const gT = (elapsed - glowDelay) / Math.max(1, dur - glowDelay);
      let gAlpha = 0;
      if (gT > 0 && gT < 1) {
        gAlpha =
          gT < glowPeakAt
            ? (gT / glowPeakAt) * glowOpacity
            : (1 - (gT - glowPeakAt) / (1 - glowPeakAt)) * glowOpacity;
      }
      glow.style.opacity = String(Math.max(0, gAlpha));
      glow.style.background = words
        .map((w) => {
          const r = Math.max(14, w.width * glowSpread);
          return `radial-gradient(${r}px ${r * 0.55}px at ${w.center}px 50%, rgba(26,23,20,0.55) 0%, transparent 72%)`;
        })
        .join(",");

      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      }
      mirrorEl.style.transform = "";
      mirrorEl.style.opacity = "";
      mirrorEl.style.filter = "";
      ph.style.transform = "";
      ph.style.opacity = "";
      ph.style.filter = "";
      glow.style.opacity = "0";
      glow.style.background = "";
      setClearing(false);
    };
    requestAnimationFrame(tick);
  };

  const hasValue = Boolean(value) && !clearing;

  return (
    <div
      ref={wrapRef}
      className={cn("t-clear", hasValue && "has-value", clearing && "is-clearing", className)}
    >
      <input
        {...inputProps}
        value={value}
        placeholder=""
        aria-label={inputProps["aria-label"] ?? placeholder}
        onChange={(e) => {
          if (clearing) return;
          onValueChange(e.target.value);
        }}
      />
      <div ref={mirrorRef} className="t-clear-mirror" aria-hidden>
        {clearing ? mirror : value}
      </div>
      <div ref={phRef} className="t-clear-placeholder" aria-hidden>
        {placeholder}
      </div>
      <div ref={glowRef} className="t-clear-glow" aria-hidden />
      <button type="button" className="t-clear-btn" aria-label="Clear" onClick={runClear}>
        <X className="size-3.5" />
      </button>
    </div>
  );
}
