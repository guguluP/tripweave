import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Slot = { src: string; video: boolean };

/**
 * Two stacked layers. The incoming picture fades in over the one still showing.
 * The parent must give this box a height; both layers are absolutely positioned.
 */
export function Crossfade({
  src,
  alt,
  video = false,
  className,
  mediaClassName,
  onVideoEnded,
  onVideoProgress,
  durationMs = 1100,
}: {
  src: string;
  alt: string;
  video?: boolean;
  className?: string;
  mediaClassName?: string;
  onVideoEnded?: () => void;
  onVideoProgress?: (ratio: number) => void;
  /** Opacity dissolve. Stories stay at 1100; a room pick can be shorter. */
  durationMs?: number;
}) {
  const [back, setBack] = useState<Slot>({ src, video });
  const [front, setFront] = useState<Slot>({ src, video });
  const [showFront, setShowFront] = useState(true);
  const visible = useRef(src);

  useEffect(() => {
    if (src === visible.current) return;
    const next = { src, video };
    if (showFront) setBack(next);
    else setFront(next);
    const frame = requestAnimationFrame(() => {
      visible.current = src;
      setShowFront((on) => !on);
    });
    return () => cancelAnimationFrame(frame);
  }, [src, video, showFront]);

  const layer = (slot: Slot, on: boolean) => {
    const fade = cn(
      "absolute inset-0 h-full w-full transition-opacity ease-in-out",
      // Prefer caller fit (story carousels use cover to reduce letterbox bars).
      slot.video ? (mediaClassName || "object-contain") : mediaClassName,
      on ? "opacity-100" : "pointer-events-none opacity-0",
    );
    const fadeStyle = { transitionDuration: `${durationMs}ms` };
    if (slot.video) {
      return (
        <video
          key={slot.src}
          src={slot.src}
          aria-label={alt}
          autoPlay
          muted
          playsInline
          controls
          className={fade}
          style={fadeStyle}
          ref={(node) => {
            if (!node) return;
            if (on) void node.play().catch(() => {});
            else node.pause();
          }}
          onTimeUpdate={(event) => {
            if (!on) return;
            const node = event.currentTarget;
            if (!Number.isFinite(node.duration) || node.duration <= 0) return;
            onVideoProgress?.(node.currentTime / node.duration);
          }}
          onEnded={() => {
            if (on) onVideoEnded?.();
          }}
        />
      );
    }
    return <img src={slot.src} alt={on ? alt : ""} className={fade} style={fadeStyle} />;
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {layer(back, !showFront)}
      {layer(front, showFront)}
    </div>
  );
}
