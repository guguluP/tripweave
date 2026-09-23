import { useEffect, useState } from "react";
import { formatMoney, type RoomType } from "@/lib/packages";
import { cn } from "@/lib/utils";

function roomPhotos(room: RoomType, gallery: string[]) {
  const own = [...new Set((room.images?.length ? room.images : [room.image]).filter(Boolean))];
  if (own.length > 1) return own;
  const around = gallery.filter((src) => src && !own.includes(src));
  return [...own, ...around].slice(0, 6);
}

export function RoomPicker({
  rooms,
  selectedId,
  onSelect,
  pricePerNight,
  leftover,
  gallery = [],
}: {
  rooms: RoomType[];
  selectedId: string;
  onSelect: (id: string) => void;
  pricePerNight: number;
  leftover?: Record<string, { remaining: number; available: boolean }>;
  gallery?: string[];
}) {
  const compact = rooms.length > 6;
  return (
    <section className="mt-10" aria-labelledby="room-picker-title">
      <h2 id="room-picker-title" className="font-display text-2xl">
        Choose a room
      </h2>
      <p className="mt-1 text-sm text-muted">
        {rooms.length} official types. Select one to open its photos and details.
      </p>
      <div
        className={cn(
          "mt-5 grid gap-3",
          compact ? "grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3",
        )}
      >
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            open={room.id === selectedId}
            compact={compact}
            pricePerNight={pricePerNight}
            left={leftover?.[room.id]}
            photos={roomPhotos(room, gallery)}
            onSelect={() => onSelect(room.id)}
          />
        ))}
      </div>
    </section>
  );
}

function RoomCard({
  room,
  open,
  compact,
  pricePerNight,
  left,
  photos,
  onSelect,
}: {
  room: RoomType;
  open: boolean;
  compact: boolean;
  pricePerNight: number;
  left?: { remaining: number; available: boolean };
  photos: string[];
  onSelect: () => void;
}) {
  const [shot, setShot] = useState(0);
  const night = pricePerNight + room.deltaPerNight;
  const soldOut = left ? !left.available : false;
  const photo = photos[shot] ?? room.image;

  useEffect(() => {
    setShot(0);
  }, [open, room.id]);

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border text-left transition-all duration-500 ease-out",
        open ? "col-span-full border-primary bg-surface shadow-sm" : "border-border bg-elevated",
        soldOut && !open && "opacity-70",
      )}
    >
      <button type="button" onClick={onSelect} aria-pressed={open} className="block w-full text-left">
        <img
          src={photo}
          alt={shot === 0 ? room.name : `${room.name}, photo ${shot + 1}`}
          className={cn(
            "w-full object-cover transition-all duration-500 ease-out",
            open ? "h-64 sm:h-80" : compact ? "h-20 sm:h-24" : "h-28",
          )}
        />
      </button>
      <div className={cn(open ? "grid gap-4 p-4 sm:grid-cols-[1fr_16rem] sm:p-5" : compact ? "p-2.5 sm:p-3" : "p-4")}>
        <button type="button" onClick={onSelect} className="block min-w-0 text-left">
          <span className={cn("block font-display leading-snug", open ? "text-2xl" : compact ? "line-clamp-2 text-sm sm:text-base" : "text-lg")}>
            {room.name}
          </span>
          <span className="mt-1 block text-xs text-muted">
            Sleeps {room.occupancy}
            {left ? (soldOut ? " · sold out" : ` · ${left.remaining} left`) : ""}
          </span>
          <span className={cn("mt-2 block text-muted", open ? "text-sm" : compact ? "line-clamp-2 text-[11px] leading-snug sm:text-xs" : "text-sm")}>
            {room.summary}
          </span>
          <span className={cn("block font-medium tabular-nums", open ? "mt-3 text-base" : compact ? "mt-2 text-xs sm:text-sm" : "mt-3 text-sm")}>
            {formatMoney(night)} / night
            {room.deltaPerNight > 0 ? (
              <span className="ml-1 text-xs font-normal text-muted">+{formatMoney(room.deltaPerNight)}</span>
            ) : (
              <span className="ml-1 text-xs font-normal text-muted">base</span>
            )}
          </span>
        </button>
        {open ? (
          <div>
            <p className="text-xs font-medium text-muted">Photos</p>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photos.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setShot(index)}
                  className={cn(
                    "h-16 w-20 shrink-0 overflow-hidden rounded-md border",
                    index === shot ? "border-primary" : "border-transparent opacity-80",
                  )}
                  aria-label={`Show photo ${index + 1} of ${room.name}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {photos.length > 1 && (room.images?.length ?? 0) > 1
                ? `Photo ${shot + 1} of ${photos.length} from the hotel.`
                : shot === 0
                  ? "This room."
                  : "Elsewhere on the property."}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
