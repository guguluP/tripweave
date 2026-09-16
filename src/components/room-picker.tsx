import { useEffect, useState } from "react";
import { formatMoney, type RoomType } from "@/lib/packages";
import { cn } from "@/lib/utils";

function RoomThumb({ src, alt }: { src: string; alt: string }) {
  const [current, setCurrent] = useState(src);
  useEffect(() => {
    setCurrent(src);
  }, [src]);
  return (
    <img
      src={current}
      alt={alt}
      className="h-28 w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => {
        const m = current.match(/i\.ytimg\.com\/vi\/([^/]+)\/([^/?]+)/);
        if (!m) return;
        const [, videoId, name] = m;
        if (name === "hqdefault.jpg") {
          setCurrent(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`);
        } else if (name === "mqdefault.jpg") {
          setCurrent(`https://i.ytimg.com/vi/${videoId}/0.jpg`);
        }
      }}
    />
  );
}


export function RoomPicker({
  rooms,
  selectedId,
  onSelect,
  pricePerNight,
}: {
  rooms: RoomType[];
  selectedId: string;
  onSelect: (id: string) => void;
  pricePerNight: number;
}) {
  return (
    <section className="mt-10" aria-labelledby="room-picker-title">
      <h2 id="room-picker-title" className="font-display text-2xl">
        Choose a room
      </h2>
      <p className="mt-1 text-sm text-muted">
        Reviewer notes below follow the room you pick. Price is per person, per night.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {rooms.map((room) => {
          const on = room.id === selectedId;
          const night = pricePerNight + room.deltaPerNight;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelect(room.id)}
              aria-pressed={on}
              className={cn(
                "overflow-hidden rounded-xl border text-left transition-colors duration-150",
                on ? "border-primary bg-surface" : "border-border bg-elevated hover:bg-surface",
              )}
            >
              <RoomThumb src={room.image} alt={room.name} />
              <span className="block p-4">
                <span className="block font-display text-lg leading-snug">{room.name}</span>
                <span className="mt-1 block text-xs text-muted">Sleeps {room.occupancy}</span>
                <span className="mt-2 block text-sm text-muted">{room.summary}</span>
                <span className="mt-3 block text-sm font-medium tabular-nums">
                  {formatMoney(night)} / night
                  {room.deltaPerNight > 0 ? (
                    <span className="ml-1 text-xs font-normal text-muted">
                      +{formatMoney(room.deltaPerNight)}
                    </span>
                  ) : (
                    <span className="ml-1 text-xs font-normal text-muted">base</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
