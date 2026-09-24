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
}: {
  src: string;
  alt: string;
  video?: boolean;
  className?: string;
  mediaClassName?: string;
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
      "absolute inset-0 h-full w-full transition-opacity duration-[1100ms] ease-in-out",
      slot.video ? "object-contain" : mediaClassName,
      on ? "opacity-100" : "pointer-events-none opacity-0",
    );
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
        />
      );
    }
    return <img src={slot.src} alt={on ? alt : ""} className={fade} />;
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {layer(back, !showFront)}
      {layer(front, showFront)}
    </div>
  );
}
