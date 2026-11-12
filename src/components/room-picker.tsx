import { useEffect, useMemo, useState } from "react";
import { Crossfade } from "@/components/crossfade";
import { travelersFitRoom } from "@/lib/inventory";
import { formatMoney, type RoomType, type TravelStyle } from "@/lib/packages";
import { recommendRooms } from "@/lib/recommend-rooms";
import { cn } from "@/lib/utils";
import { MotionToggle } from "@/components/motion";

/** Frames the room actually published. Does not fall back to a property shot. */
function photosForRoom(room: RoomType, propertyGallery: string[] = []) {
  const raw = [...new Set((room.images?.length ? room.images : [room.image]).filter(Boolean))];
  // attachPropertyMedia uses the first property photo when a room has no catalog frames.
  if (raw.length === 1 && propertyGallery[0] && raw[0] === propertyGallery[0]) return [];
  return raw;
}

function roomPhotos(room: RoomType, _gallery: string[]) {
  // Mobile/tablet cards keep the published `image` (including the property fallback).
  return [...new Set((room.images?.length ? room.images : [room.image]).filter(Boolean))];
}

function isDesktopLayout() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}

export function RoomPicker({
  rooms,
  selectedId,
  onSelect,
  pricePerNight,
  leftover,
  gallery = [],
  style,
  guestCount,
  publishedRooms = true,
  onViewPhotos,
}: {
  rooms: RoomType[];
  selectedId: string;
  onSelect: (id: string) => void;
  pricePerNight: number;
  leftover?: Record<string, { remaining: number; available: boolean; released?: boolean; soldOut?: boolean }>;
  gallery?: string[];
  /** Brief travel style biases family into the recommended set. */
  style?: TravelStyle;
  /** When set, rooms that cannot sleep this many people are disabled. */
  guestCount?: number;
  /** False when the room names are catalog categories, not a published room list. */
  publishedRooms?: boolean;
  /** Desktop only: open this room's photos in the sticky gallery. */
  onViewPhotos?: (room: RoomType, photos: string[]) => void;
}) {
  const recommended = useMemo(() => recommendRooms(rooms, style, guestCount), [rooms, style, guestCount]);
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
            {publishedRooms
              ? showAll
                ? `${rooms.length} official types. Leftover rooms are the keys TripWeave can sell until a hotel desk sets its own count.`
                : `${recommended.length} recommended for this brief (base / sea-view / family). ${rooms.length} official types in total.`
              : `${rooms.length} rooms. The desk confirms the category. Leftover keys are what TripWeave can sell until the hotel sets a count.`}
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
          // lg: one compact column for the split-screen stay page; tablet keeps the existing grid.
          compact ? "grid-cols-2 lg:grid-cols-1" : "sm:grid-cols-3 lg:grid-cols-1",
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
            publishedPhotos={photosForRoom(room, gallery)}
            tooSmall={guestCount != null && guestCount > 0 && !travelersFitRoom(room.occupancy, guestCount)}
            guestCount={guestCount}
            onSelect={() => onSelect(room.id)}
            onViewPhotos={
              onViewPhotos
                ? () => {
                    if (!isDesktopLayout()) return;
                    onViewPhotos(room, photosForRoom(room, gallery));
                  }
                : undefined
            }
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
  publishedPhotos,
  onSelect,
  badge,
  tooSmall = false,
  guestCount,
  onViewPhotos,
}: {
  room: RoomType;
  open: boolean;
  compact: boolean;
  pricePerNight: number;
  left?: { remaining: number; available: boolean; released?: boolean; soldOut?: boolean };
  photos: string[];
  publishedPhotos: string[];
  onSelect: () => void;
  badge?: string;
  tooSmall?: boolean;
  guestCount?: number;
  onViewPhotos?: () => void;
}) {
  const [shot, setShot] = useState(0);
  const night = pricePerNight + room.deltaPerNight;
  const soldOut = left?.soldOut ?? (left ? !left.available && left.released !== false : false);
  const photo = photos[shot] ?? room.image;
  const publishedCount = publishedPhotos.length;
  const choose = () => {
    if (tooSmall) return;
    onSelect();
    onViewPhotos?.();
  };

  useEffect(() => {
    setShot(0);
  }, [open, room.id]);

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border text-left transition-all duration-500 ease-out lg:flex lg:flex-row",
        open ? "col-span-full border-primary bg-surface shadow-sm lg:col-span-1" : "border-border bg-elevated hover:border-primary/40",
        soldOut && !open && "opacity-70",
        tooSmall && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={tooSmall ? undefined : choose}
        disabled={tooSmall}
        aria-pressed={open}
        aria-disabled={tooSmall || undefined}
        aria-label={
          publishedCount > 0
            ? `${room.name}, ${publishedCount} ${publishedCount === 1 ? "photo" : "photos"}`
            : `${room.name}, no photos published`
        }
        className="block w-full text-left disabled:cursor-not-allowed lg:w-auto lg:shrink-0"
      >
        <div className="relative">
          {photo ? (
          <Crossfade
            src={photo}
            alt={shot === 0 ? room.name : `${room.name}, photo ${shot + 1}`}
            className={cn(
              "w-full transition-all duration-500 ease-out lg:h-24 lg:w-28",
              open ? "h-64 sm:h-80 lg:h-24" : compact ? "h-20 sm:h-24" : "h-28",
            )}
            mediaClassName="object-cover"
          />
          ) : (
            <div
              className={cn(
                "grid w-full place-items-center bg-border text-xs text-muted lg:h-24 lg:w-28",
                open ? "h-64 sm:h-80 lg:h-24" : compact ? "h-20 sm:h-24" : "h-28",
              )}
            >
              No photo
            </div>
          )}
          {badge ? (
            <span className="absolute left-2 top-2 rounded-full bg-elevated/95 px-2 py-0.5 text-[10px] font-medium text-fg">
              {badge}
            </span>
          ) : null}
          {publishedCount > 0 ? (
            <span className="absolute bottom-1 right-1 hidden rounded bg-fg/80 px-1.5 py-0.5 text-[10px] font-medium text-bg lg:block">
              {publishedCount} {publishedCount === 1 ? "photo" : "photos"}
            </span>
          ) : (
            <span className="absolute inset-x-1 bottom-1 hidden rounded bg-fg/80 px-1.5 py-0.5 text-center text-[10px] font-medium text-bg lg:block">
              No photos published
            </span>
          )}
        </div>
      </button>
      <div className={cn(open ? "grid gap-4 p-4 sm:grid-cols-[1fr_16rem] sm:p-5 lg:grid-cols-1 lg:p-3" : compact ? "p-2.5 sm:p-3" : "p-4", "lg:min-w-0 lg:flex-1")}>
        <button
          type="button"
          onClick={tooSmall ? undefined : choose}
          disabled={tooSmall}
          className="block min-w-0 text-left disabled:cursor-not-allowed"
        >
          <span className={cn("block font-display leading-snug", open ? "text-2xl" : compact ? "line-clamp-2 text-sm sm:text-base" : "text-lg")}>
            {room.name}
          </span>
          <span className="mt-1 block text-xs text-muted">
            {tooSmall && guestCount
              ? `Sleeps ${room.occupancy} · too small for ${guestCount}`
              : `Sleeps ${room.occupancy}${left ? (soldOut ? " · sold out" : left.released === false ? " · on request" : ` · ${left.remaining} left`) : ""}`}
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
          {publishedCount === 0 ? (
            <span className="mt-2 hidden text-xs text-muted lg:block">No photos published for this room.</span>
          ) : null}
        </button>
        {open ? (
          <div className="lg:hidden">
            <p className="text-xs font-medium text-muted">Photos</p>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photos.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setShot(index)}
                  className={cn(
                    "h-16 w-20 shrink-0 overflow-hidden rounded-md border transition-[border-color,opacity,transform] duration-300 ease-out",
                    index === shot ? "scale-100 border-primary" : "scale-95 border-transparent opacity-80",
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
