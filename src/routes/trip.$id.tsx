import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { Shell } from "@/components/shell";
import { TrustMeter } from "@/components/trust-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DigitPop, Stagger, TextSwap } from "@/components/motion";
import { RollingPrice } from "@/components/motion/rolling-price";
import { LikeButton } from "@/components/motion";
import { PropertyMedia } from "@/components/property-media";
import { StayCover } from "@/components/stay-cover";
import { ReviewerConsensus } from "@/components/reviewer-consensus";
import { TrustHonestyStrip } from "@/components/trust-honesty";
import { StayMap } from "@/components/stay-map";
import { stayAmenityFacts, isLimitedPhotoSet } from "@/lib/stay-amenities";
import { recommendRooms } from "@/lib/recommend-rooms";
import { refundPolicyFor } from "@/lib/refund-policy";
import { loadBriefWithDates } from "@/lib/brief-persist";
import { RoomPicker } from "@/components/room-picker";
import { StayQuoteCard } from "@/components/stay-quote";
import { DigiYatraPanel, TransportPanel, BusGuidePanel } from "@/components/transport-panel";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { computeTrustScore, youtubeSourceCount, type TrustScoreBreakdown } from "@/lib/trust-score";
import {
  clampNights,
  daysForStay,
  formatMoney,
  getPackage,
  getRoom,
  loadPending,
  nightsPhrase,
  rememberLiveTrustScore,
  saveNext,
  savePending,
} from "@/lib/packages";
import { addDays, leftoverForRooms, quoteStay, todayIso } from "@/lib/inventory";
import { deskFor } from "@/lib/hotel-desk";
import { getSeededConsensus } from "@/lib/youtube/get-seeded";
import { usePaidHolds } from "@/lib/use-occupancy";
import { cn } from "@/lib/utils";
import { getJourney } from "@/lib/transport";
import { writeMeta } from "@/lib/booking-meta";
import {
  arrivalPinLabel,
  defaultTravelPlan,
  EMPTY_TRAVEL,
  patchTravelDraft,
  pickupChargeInr,
  quoteTravel,
  type TravelPlan,
} from "@/lib/travel-plan";

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
  const [checkIn, setCheckIn] = useState(() => addDays(todayIso(), 1));
  const [liveTrust, setLiveTrust] = useState<number | null>(null);
  const [liveBreakdown, setLiveBreakdown] = useState<TrustScoreBreakdown | null>(null);
  const [travel, setTravel] = useState<TravelPlan>(EMPTY_TRAVEL);
  usePaidHolds();

  useEffect(() => {
    if (!pkg) return;
    const briefNights = typeof window === "undefined" ? pkg.nights : loadBriefWithDates().nights;
    const nextNights = clampNights(pkg, briefNights);
    setNights(nextNights);
    const leftover = leftoverForRooms(pkg.id, checkIn, nextNights);
    const briefStyle = loadBriefWithDates().style;
    const recommended = recommendRooms(pkg.rooms, briefStyle);
    const firstOpen =
      recommended.find((r) => leftover[r.id]?.available) ??
      pkg.rooms.find((r) => leftover[r.id]?.available) ??
      recommended[0] ??
      pkg.rooms[0]!;
    setRoomId(firstOpen.id);
    setSwaps({});
    setBooking(false);
    const briefNow = loadBriefWithDates();
    const pending = loadPending();
    if (briefNow.checkIn) setCheckIn(briefNow.checkIn);
    else if (pending?.checkIn) setCheckIn(pending.checkIn);
    setTravel(defaultTravelPlan(pkg.id, briefNow, pending?.packageId === pkg.id ? pending.travel : undefined));
    // Only when the stay changes. Catalog overlays rebuild `pkg` every render,
    // and depending on that object wiped the room the guest had just picked.
  }, [pkg?.id]);

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
  const quote = quoteStay({
    packageId: pkg.id,
    roomId: room.id,
    checkIn,
    nights,
    swaps,
  });
  const price = quote?.perPerson ?? 0;
  const brief = loadBriefWithDates();
  const amenities = stayAmenityFacts(pkg);
  const journey = getJourney(pkg.id, brief.origin, brief.arriveBy);
  const travelQuote = quoteTravel(pkg.id, brief, travel);
  const pickupInr = pickupChargeInr(pkg.id, { ...travel, arriveBy: brief.arriveBy, origin: brief.origin });
  const trust = computeTrustScore(pkg);
  const seedConsensus = getSeededConsensus(pkg.id);
  const nightlyRate = quote && quote.nights > 0 ? Math.round(quote.perPerson / quote.nights) : pkg.pricePerNight + (room.deltaPerNight || 0);
  const desk = deskFor(pkg.id);
  const gstLine = desk.gstin
    ? `GSTIN ${desk.gstin} · taxes included at checkout`
    : "GST as billed by the hotel at checkout";
  const refundLabel = refundPolicyFor(checkIn).label;

  const setTravelAndDraft = (next: TravelPlan) => {
    const merged = { ...next, arriveBy: brief.arriveBy, origin: brief.origin };
    setTravel(merged);
    patchTravelDraft(pkg.id, merged);
  };

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
    const plan = { ...travel, arriveBy: brief.arriveBy, origin: brief.origin };
    savePending({
      packageId: pkg.id,
      swaps: writeMeta(swaps, { travel: plan, pickupInr, roomId: room.id }),
      nights,
      roomId: room.id,
      checkIn,
      travel: plan,
    });
    if (isPending) return;
    setBooking(true);
    if (!user) {
      saveNext("/travelers");
      void nav({ to: "/login" });
      return;
    }
    void nav({ to: "/travelers" });
  };

  const gallery = useMemo(() => {
    const list = pkg.images.filter(Boolean);
    if (pkg.image && !list.includes(pkg.image)) return [pkg.image, ...list];
    return list.length ? list : pkg.image ? [pkg.image] : [];
  }, [pkg]);
  const [openToken, setOpenToken] = useState(0);
  const [frame, setFrame] = useState({ src: gallery[0] ?? pkg.image, position: 1, total: gallery.length });
  const pin = arrivalPinLabel(brief.arriveBy);

  return (
    <Shell>
      <StayCover
        image={frame.src}
        name={pkg.name}
        detail={`${pkg.neighborhood} · ${pkg.destination} · ${pkg.nightsMin}–${pkg.nightsMax} nights`}
      >
        <button
          type="button"
          className="absolute inset-0 z-10"
          aria-label={`View photos of ${pkg.name}`}
          onClick={() => setOpenToken((n) => n + 1)}
        />
        <span className="pointer-events-none absolute left-4 top-[4.75rem] z-20 rounded-full bg-elevated/95 px-3 py-1 text-xs font-medium text-fg">
          {frame.position} / {frame.total}
          {frame.total > 0 && frame.total < 4 ? " · hotel-published, limited set" : ""}
        </span>
        {pin ? (
          <span className="pointer-events-none absolute left-4 top-[7.25rem] z-20 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-fg">
            <MapPin className="size-3" />
            {pin}
          </span>
        ) : null}
        <div className="absolute right-4 top-[4.75rem] z-20">
          <LikeButton id={pkg.id} />
        </div>
      </StayCover>
      <div id="stay-photos">
      <PropertyMedia
        id={pkg.id}
        name={pkg.name}
        images={pkg.images}
        roomImages={pkg.rooms.flatMap((room) => room.images ?? (room.image ? [room.image] : []))}
        videos={pkg.videos}
        hideHero
        onPhoto={(src, position, total) => setFrame({ src, position, total })}
        openToken={openToken}
      />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-44 md:pb-32">
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Stagger>
            <p className="eyebrow">{pkg.destination}</p>
            <h1 className="font-display text-4xl text-fg">{pkg.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-3.5" />
              {pkg.neighborhood} · {pkg.nightsMin}–{pkg.nightsMax} nights
            </p>
          </Stagger>
          <TrustMeter
            score={liveTrust ?? trust.total}
            youtubeSources={youtubeSourceCount(pkg)}
            breakdown={liveBreakdown ?? trust}
          />
        </div>

        <TrustHonestyStrip
          packageId={pkg.id}
          consensus={liveBreakdown ? undefined : seedConsensus}
          honestyBonus={(liveBreakdown ?? trust).honestyBonus}
        />

        <p className="mt-6 text-muted">{pkg.summary}</p>
        <StayMap packageId={pkg.id} name={pkg.name} />

        <div className="mt-6 flex flex-wrap gap-2">
          {pkg.includes.map((item) => (
            <Badge key={item} className="gap-1">
              <Check className="size-3" />
              {item}
            </Badge>
          ))}
        </div>

        {amenities.length > 0 ? (
          <section className="mt-8" aria-labelledby="stay-amenities-title">
            <h2 id="stay-amenities-title" className="font-display text-2xl">
              At a glance
            </h2>
            <p className="mt-1 text-sm text-muted">
              Only facts we already have — walking times are straight-line estimates.
              {isLimitedPhotoSet(pkg.images.length)
                ? " Photos are hotel-published, limited set."
                : ""}
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {amenities.map((fact) => (
                <li
                  key={fact.id}
                  className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm"
                >
                  <p className="font-medium">{fact.label}</p>
                  <p className="text-muted">{fact.value}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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

        <StayQuoteCard
          quote={quote}
          checkIn={checkIn}
          minDate={todayIso()}
          onCheckIn={setCheckIn}
        />

        <RoomPicker
          rooms={pkg.rooms}
          selectedId={room.id}
          onSelect={setRoomId}
          pricePerNight={pkg.pricePerNight}
          leftover={leftoverForRooms(pkg.id, checkIn, nights)}
          gallery={pkg.images}
          style={brief.style}
        />

        <ReviewerConsensus
          packageId={pkg.id}
          roomId={room.id}
          roomName={room.name}
          onConsensus={(consensus) => {
            const next = computeTrustScore(pkg, consensus);
            rememberLiveTrustScore(pkg.id, next.total);
            setLiveTrust(next.total);
            setLiveBreakdown(next);
          }}
        />

        <div className="mt-10 grid gap-4">
          <TransportPanel
            journey={journey}
            quote={travelQuote}
            plan={{ ...travel, arriveBy: brief.arriveBy, origin: brief.origin }}
            onChange={setTravelAndDraft}
            interactive
          />
          {journey.showBusGuide ? <BusGuidePanel /> : null}
          {journey.showDigiYatra ? <DigiYatraPanel /> : null}
        </div>

        <h2 className="mt-10 font-display text-2xl">Stay plan</h2>
        <p className="mt-1 text-sm text-muted">
          Swap activities — the room price updates live.
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
          <div className="min-w-0">
            <p className="font-display text-xl tabular-nums">
              <RollingPrice value={price} />
            </p>
            <p className="text-xs text-muted">
              {quote?.available
                ? `${formatMoney(nightlyRate)} / night · ${room.name} · ${nightsPhrase(nights)} · sleeps ${room.occupancy}`
                : "Sold out — pick another date"}
            </p>
            {quote?.available ? (
              <p className="mt-0.5 text-[0.65rem] leading-snug text-subtle">
                Stay total {formatMoney(price)}
                {pickupInr > 0 ? ` · pickup ${formatMoney(pickupInr)} at checkout` : ""}
                {" · "}
                {gstLine}
                {" · "}
                {refundLabel}
              </p>
            ) : null}
          </div>
          <Button size="lg" onClick={goBook} disabled={isPending || !quote?.available}>
            <TextSwap text={booking ? "Traveller details…" : "Book this stay"} shimmer={booking} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
