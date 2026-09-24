import { useEffect, useState } from "react";
import { Crossfade } from "@/components/crossfade";
import { cn } from "@/lib/utils";

type Frame = {
  id: string;
  label: string;
  src: string;
  kind: "image" | "video";
  note?: string;
};

const RATH_FRAMES: Frame[] = [
  { id: "gate", label: "Temple gate", src: "/rath-yatra/gate.jpg", kind: "image" },
  { id: "spire", label: "White spires", src: "/rath-yatra/spires.jpg", kind: "image" },
  { id: "crowd", label: "The crowd", src: "/rath-yatra/crowd.jpg", kind: "image" },
  { id: "chariot", label: "Chariot", src: "/rath-yatra/chariot.jpg", kind: "image" },
  { id: "street", label: "Grand Road", src: "/rath-yatra/street.jpg", kind: "image" },
  {
    id: "sunabesa",
    label: "Sunabesa",
    src: "/rath-yatra/flags.jpg",
    kind: "image",
    note: "Sunabesa — the lords in gold jewellery",
  },
  {
    id: "sunabesa-close",
    label: "Sunabesa, closer",
    src: "/rath-yatra/close.jpg",
    kind: "image",
    note: "Sunabesa — the lords in gold jewellery",
  },
  { id: "close-film", label: "Chariot, up close", src: "/rath-yatra/chariot-close.mp4", kind: "video" },
  { id: "detail-film", label: "Chariot detail", src: "/rath-yatra/chariot-detail.mp4", kind: "video" },
];

const KONARK_FRAMES: Frame[] = [
  { id: "quote", label: "Sand face", src: "/konark/sand-quote.jpg", kind: "image", note: "Sand art, Chandrabhaga beach" },
  { id: "faces", label: "Three faces", src: "/konark/sand-faces.jpg", kind: "image", note: "Sand art, Chandrabhaga beach" },
  { id: "lotus", label: "Lotus shrine", src: "/konark/sand-lotus.jpg", kind: "image", note: "Sand art, Chandrabhaga beach" },
  { id: "stupa", label: "Stupa", src: "/konark/sand-stupa.jpg", kind: "image", note: "Sand art, Chandrabhaga beach" },
  { id: "night", label: "Night show", src: "/konark/night-show.mp4", kind: "video", note: "Konark temple at night" },
];

function StoryCarousel({
  kicker,
  title,
  frames,
  tone,
}: {
  kicker: string;
  title: string;
  frames: Frame[];
  tone: "dark" | "sand";
}) {
  const [active, setActive] = useState(0);
  const frame = frames[active]!;
  const dark = tone === "dark";

  useEffect(() => {
    if (frame.kind === "video") return;
    const id = window.setTimeout(() => {
      setActive((n) => {
        const next = (n + 1) % frames.length;
        if (frames[next]?.kind !== "video") return next;
        const firstStill = frames.findIndex((item) => item.kind === "image");
        return firstStill === -1 ? next : firstStill;
      });
    }, 7000);
    return () => window.clearTimeout(id);
  }, [active, frame.kind, frames]);

  return (
    <section className={dark ? "bg-fg text-primary-fg" : "bg-elevated text-fg"}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[18rem_1fr] lg:items-center">
        <div>
          <p className={cn("text-xs uppercase tracking-[0.18em]", dark ? "text-primary-fg/60" : "text-muted")}>{kicker}</p>
          <h2 className="mt-3 font-display text-4xl">{title}</h2>
          <ul className="mt-8 grid gap-2">
            {frames.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-full px-4 py-3 text-left text-sm transition-colors duration-300",
                    index === active
                      ? dark
                        ? "bg-primary-fg text-fg"
                        : "bg-fg text-primary-fg"
                      : dark
                        ? "bg-primary-fg/10 hover:bg-primary-fg/20"
                        : "bg-fg/5 hover:bg-fg/10",
                  )}
                >
                  {item.label}
                  {index === active && frame.kind !== "video" ? (
                    <span className={cn("story-progress", dark ? "bg-fg/40" : "bg-primary-fg/50")} />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <figure className="overflow-hidden rounded-[2rem] bg-black">
          <div className="relative">
            <Crossfade
              src={frame.src}
              alt={frame.note ?? frame.label}
              video={frame.kind === "video"}
              className="story-frame aspect-[4/3] max-h-[70vh] w-full bg-black"
              mediaClassName="object-cover"
            />
            {frame.note ? (
              <figcaption
                key={frame.id}
                className="story-caption absolute bottom-4 left-4 rounded-full bg-black/70 px-4 py-2 text-sm text-white"
              >
                {frame.note}
              </figcaption>
            ) : null}
          </div>
        </figure>
      </div>
    </section>
  );
}

export function RathCarousel() {
  return <StoryCarousel kicker="Rath Yatra" title="Puri, from the road" frames={RATH_FRAMES} tone="dark" />;
}

export function KonarkCarousel() {
  return <StoryCarousel kicker="Konark" title="Temple night, and sand at Chandrabhaga" frames={KONARK_FRAMES} tone="sand" />;
}
