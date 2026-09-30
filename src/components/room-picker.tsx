import { useEffect, useMemo, useState } from "react";
import { Crossfade } from "@/components/crossfade";
import { formatMoney, type RoomType, type TravelStyle } from "@/lib/packages";
import { recommendRooms } from "@/lib/recommend-rooms";
import { cn } from "@/lib/utils";
import { MotionToggle } from "@/components/motion";

function roomPhotos(room: RoomType, _gallery: string[]) {
  return [...new Set((room.images?.length ? room.images : [room.image]).filter(Boolean))];
}

export function RoomPicker({
  rooms,
  selectedId,
  onSelect,
  pricePerNight,
  leftover,
  gallery = [],
  style,
}: {
  rooms: RoomType[];
  selectedId: string;
  onSelect: (id: string) => void;
  pricePerNight: number;
  leftover?: Record<string, { remaining: number; available: boolean; released?: boolean; soldOut?: boolean }>;
  gallery?: string[];
  /** Brief travel style biases family into the recommended set. */
  style?: TravelStyle;
}) {
  const recommended = useMemo(() => recommendRooms(rooms, style), [rooms, style]);
  const [showAll, setShowAll] = useState(rooms.length <= 3);
  const visible = showAll ? rooms : recommended;
  const compact = visible.length > 6;

  useEffect(() => {
    // If the selected room is hidden behind the toggle, reveal all official rooms.
    if (!showAll && !recommended.some((r) => r.id === selectedId)) {
      setShowAll(true);
    }
  }, [selectedId, recommended, showAll]);

  return (
    <section className="mt-10" aria-labelledby="room-picker-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="room-picker-title" className="font-display text-2xl">
            Choose a room
          </h2>
          <p className="mt-1 text-sm text-muted">
            {showAll
              ? `${rooms.length} official types. Leftover rooms are the keys TripWeave can sell until a hotel desk sets its own count.`
              : `${recommended.length} recommended for this brief (base / sea-view / family). ${rooms.length} official types in total.`}
          </p>
        </div>
        {rooms.length > 3 ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-elevated px-3 py-2">
            <span className="text-xs text-muted">All official rooms</span>
            <MotionToggle on={showAll} onChange={setShowAll} label="All official rooms" />
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          "mt-5 grid gap-3",
          compact ? "grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3",
        )}
      >
        {visible.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            open={room.id === selectedId}
            compact={compact}
            pricePerNight={pricePerNight}
            left={leftover?.[room.id]}
            photos={roomPhotos(room, gallery)}
            onSelect={() => onSelect(room.id)}
            badge={
              !showAll
                ? undefined
                : recommended.some((r) => r.id === room.id)
                  ? "Recommended"
                  : undefined
            }
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
  badge,
}: {
  room: RoomType;
  open: boolean;
  compact: boolean;
  pricePerNight: number;
  left?: { remaining: number; available: boolean; released?: boolean; soldOut?: boolean };
  photos: string[];
  onSelect: () => void;
  badge?: string;
}) {
  const [shot, setShot] = useState(0);
  const night = pricePerNight + room.deltaPerNight;
  const soldOut = left?.soldOut ?? (left ? !left.available && left.released !== false : false);
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
        <div className="relative">
          <Crossfade
            src={photo}
            alt={shot === 0 ? room.name : `${room.name}, photo ${shot + 1}`}
            className={cn(
              "w-full transition-all duration-500 ease-out",
              open ? "h-64 sm:h-80" : compact ? "h-20 sm:h-24" : "h-28",
            )}
            mediaClassName="object-cover"
          />
          {badge ? (
            <span className="absolute left-2 top-2 rounded-full bg-elevated/95 px-2 py-0.5 text-[10px] font-medium text-fg">
              {badge}
            </span>
          ) : null}
        </div>
      </button>
      <div className={cn(open ? "grid gap-4 p-4 sm:grid-cols-[1fr_16rem] sm:p-5" : compact ? "p-2.5 sm:p-3" : "p-4")}>
        <button type="button" onClick={onSelect} className="block min-w-0 text-left">
          <span className={cn("block font-display leading-snug", open ? "text-2xl" : compact ? "line-clamp-2 text-sm sm:text-base" : "text-lg")}>
            {room.name}
          </span>
          <span className="mt-1 block text-xs text-muted">
            Sleeps {room.occupancy}
            {left ? (soldOut ? " · sold out" : left.released === false ? " · on request" : ` · ${left.remaining} left`) : ""}
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
                    "h-16 w-20 shrink-0 overflow-hidden rounded-md border transition-[border-color,opacity] duration-300",
                    index === shot ? "border-primary" : "border-transparent opacity-80",
                  )}
                  aria-label={`Show photo ${index + 1} of ${room.name}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {photos.length > 1
                ? `Photo ${shot + 1} of ${photos.length}`
                : photos.length === 1
                  ? "Hotel-published, limited set"
                  : "This room."}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
