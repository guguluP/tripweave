import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FRAMES = [
  { id: "gate", label: "Temple gate", src: "/rath-yatra/gate.jpg", kind: "image" as const },
  { id: "spire", label: "White spires", src: "/rath-yatra/spires.jpg", kind: "image" as const },
  { id: "crowd", label: "The crowd", src: "/rath-yatra/crowd.jpg", kind: "image" as const },
  { id: "chariot", label: "Chariot", src: "/rath-yatra/chariot.jpg", kind: "image" as const },
  { id: "street", label: "Grand Road", src: "/rath-yatra/street.jpg", kind: "image" as const },
  { id: "flags", label: "Flags", src: "/rath-yatra/flags.jpg", kind: "image" as const },
  { id: "close", label: "Close up", src: "/rath-yatra/close.jpg", kind: "image" as const },
  { id: "film", label: "Rath Yatra film", src: "/rath-yatra/yatra.mp4", kind: "video" as const },
];

export function RathCarousel() {
  const [active, setActive] = useState(0);
  const frame = FRAMES[active]!;

  useEffect(() => {
    if (frame.kind === "video") return;
    const id = window.setTimeout(() => setActive((n) => (n + 1) % FRAMES.length), 7000);
    return () => window.clearTimeout(id);
  }, [active, frame.kind]);

  return (
    <section className="bg-fg text-primary-fg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[18rem_1fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary-fg/60">Rath Yatra</p>
          <h2 className="mt-3 font-display text-4xl">Puri, from the road</h2>
          <ul className="mt-8 grid gap-2">
            {FRAMES.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    "w-full rounded-full px-4 py-3 text-left text-sm",
                    index === active ? "bg-primary-fg text-fg" : "bg-primary-fg/10 hover:bg-primary-fg/20",
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-hidden rounded-[2rem] bg-black">
          {frame.kind === "video" ? (
            <video key={frame.src} src={frame.src} className="aspect-[4/3] w-full object-cover" autoPlay muted playsInline controls />
          ) : (
            <img key={frame.src} src={frame.src} alt={frame.label} className="aspect-[4/3] w-full object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}
