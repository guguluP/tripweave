import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { Shell } from "@/components/shell";
import { TrustMeter } from "@/components/trust-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DigitPop, Stagger, TextSwap } from "@/components/motion";
import { PropertyMedia } from "@/components/property-media";
import { ReviewerConsensus } from "@/components/reviewer-consensus";
import { RoomPicker } from "@/components/room-picker";
import { DigiYatraPanel, TransportPanel } from "@/components/transport-panel";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { youtubeSourceCount } from "@/lib/trust-score";
import {
  clampNights,
  daysForStay,
  formatMoney,
  getPackage,
  getRoom,
  loadBrief,
  nightsPhrase,
  saveNext,
  savePending,
  stayTotal,
} from "@/lib/packages";
import { cn } from "@/lib/utils";
import { getJourney } from "@/lib/transport";

export const Route = createFileRoute("/trip/$id")({ component: TripDetail });

function TripDetail() {
  const { id } = Route.useParams();
  const pkg = getPackage(id);
  const nav = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState(false);
  const [nights, setNights] = useState(pkg?.nights ?? 1);
  const [roomId, setRoomId] = useState(pkg?.rooms[0]?.id ?? "");

  useEffect(() => {
    if (!pkg) return;
    const briefNights = typeof window === "undefined" ? pkg.nights : loadBrief().nights;
    setNights(clampNights(pkg, briefNights));
    setRoomId(pkg.rooms[0]!.id);
    setSwaps({});
    setBooking(false);
  }, [pkg]);

  if (!pkg) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-display text-3xl">Stay not found</h1>
          <Button asChild className="mt-6">
            <Link to="/">Back to Discover</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const room = getRoom(pkg, roomId);
  const days = daysForStay(pkg, nights);
  const price = stayTotal(pkg, nights, room.id, swaps);
  const brief = loadBrief();
  const journey = getJourney(pkg.id, brief.origin, brief.arriveBy);

  const toggleSwap = (dayIdx: number, optionId: string) => {
    setSwaps((s) => {
      const key = String(dayIdx);
      const next = { ...s };
      if (next[key] === optionId) delete next[key];
      else next[key] = optionId;
      return next;
    });
  };

  const goBook = () => {
    savePending({ packageId: pkg.id, swaps, nights, roomId: room.id });
    if (isPending) return;
    setBooking(true);
    if (!user) {
      saveNext("/travelers");
      void nav({ to: "/login" });
      return;
    }
    void nav({ to: "/travelers" });
  };

  return (
    <Shell>
      <PropertyMedia
        id={pkg.id}
        name={pkg.name}
        images={pkg.images}
        videos={pkg.videos}
      />
      <div className="mx-auto max-w-3xl px-4 pb-28">
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Stagger>
            <p className="eyebrow">{pkg.destination}</p>
            <h1 className="font-display text-4xl text-fg">{pkg.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-3.5" />
              {pkg.neighborhood} · {pkg.nightsMin}–{pkg.nightsMax} nights
            </p>
          </Stagger>
          <TrustMeter score={pkg.trustScore} youtubeSources={youtubeSourceCount(pkg)} />
        </div>

        <p className="mt-6 text-muted">{pkg.summary}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {pkg.includes.map((item) => (
            <Badge key={item} className="gap-1">
              <Check className="size-3" />
              {item}
            </Badge>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium">Nights</p>
          <div className="mt-3 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setNights((n) => clampNights(pkg, n - 1))}
              aria-label="Fewer nights"
              disabled={nights <= pkg.nightsMin}
            >
              −
            </Button>
            <span className="min-w-16 text-center font-display text-2xl tabular-nums">
              <DigitPop value={nights} />
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setNights((n) => clampNights(pkg, n + 1))}
              aria-label="More nights"
              disabled={nights >= pkg.nightsMax}
            >
              +
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">
            One-night temple trips are welcome. Recommended here: {nightsPhrase(pkg.nights)}.
          </p>
        </div>

        <RoomPicker
          rooms={pkg.rooms}
          selectedId={room.id}
          onSelect={setRoomId}
          pricePerNight={pkg.pricePerNight}
        />

        <ReviewerConsensus packageId={pkg.id} roomId={room.id} roomName={room.name} />

        <div className="mt-10 grid gap-4">
          <TransportPanel journey={journey} />
          {journey.showDigiYatra ? <DigiYatraPanel /> : null}
        </div>

        <h2 className="mt-10 font-display text-2xl">Stay plan</h2>
        <p className="mt-1 text-sm text-muted">
          Swap activities — the all-in rupee price updates live.
        </p>
        <div className="mt-5 grid gap-3">
          {days.map((day, i) => (
            <Card key={`${day.title}-${i}`} className="p-4 shadow-none">
              <p className="eyebrow">Day {i + 1}</p>
              <h3 className="mt-1 font-display text-lg">{day.title}</h3>
              <p className="mt-1 text-sm text-muted">{day.base}</p>
              {day.options.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {day.options.map((o) => {
                    const on = swaps[String(i)] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => toggleSwap(i, o.id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                          on
                            ? "border-primary bg-primary text-primary-fg"
                            : "border-border bg-surface text-muted hover:text-fg",
                        )}
                      >
                        {o.label} ({o.delta >= 0 ? "+" : ""}
                        {formatMoney(o.delta)})
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-border bg-elevated/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:bottom-0 md:pb-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl tabular-nums">
              <DigitPop value={formatMoney(price)} />
            </p>
            <p className="text-xs text-muted">
              all-in · per person · {nightsPhrase(nights)} · {room.name}
            </p>
          </div>
          <Button size="lg" onClick={goBook} disabled={isPending}>
            <TextSwap text={booking ? "Traveller details…" : "Book this stay"} shimmer={booking} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
