import { formatMoney, type RoomType } from "@/lib/packages";
import { cn } from "@/lib/utils";

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
  const compact = rooms.length > 6;
  return (
    <section className="mt-10" aria-labelledby="room-picker-title">
      <h2 id="room-picker-title" className="font-display text-2xl">
        Choose a room
      </h2>
      <p className="mt-1 text-sm text-muted">
        {rooms.length} official types. Reviewer notes follow the room you pick.
        Price is per person, per night.
      </p>
      <div
        className={cn(
          "mt-5 grid gap-3",
          compact ? "grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3",
        )}
      >
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
                "min-w-0 overflow-hidden rounded-xl border text-left transition-colors duration-150",
                on ? "border-primary bg-surface" : "border-border bg-elevated hover:bg-surface",
              )}
            >
              <img
                src={room.image}
                alt={room.name}
                className={cn("w-full object-cover", compact ? "h-20 sm:h-24" : "h-28")}
                loading="lazy"
                decoding="async"
              />
              <span className={cn("block", compact ? "p-2.5 sm:p-3" : "p-4")}>
                <span
                  className={cn(
                    "block font-display leading-snug",
                    compact ? "text-sm sm:text-base line-clamp-2" : "text-lg",
                  )}
                >
                  {room.name}
                </span>
                <span className="mt-1 block text-xs text-muted">Sleeps {room.occupancy}</span>
                <span
                  className={cn(
                    "mt-1 block text-muted",
                    compact ? "text-[11px] leading-snug line-clamp-2 sm:text-xs" : "mt-2 text-sm",
                  )}
                >
                  {room.summary}
                </span>
                <span
                  className={cn(
                    "block font-medium tabular-nums",
                    compact ? "mt-2 text-xs sm:text-sm" : "mt-3 text-sm",
                  )}
                >
                  {formatMoney(night)} / night
                  {room.deltaPerNight > 0 ? (
                    <span className="ml-1 text-[11px] font-normal text-muted sm:text-xs">
                      +{formatMoney(room.deltaPerNight)}
                    </span>
                  ) : (
                    <span className="ml-1 text-[11px] font-normal text-muted sm:text-xs">base</span>
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
