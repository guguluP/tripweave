import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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
import { formatCheckInLabel, StayQuoteCard } from "@/components/stay-quote";
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
import { checkInOnOrAfterToday, leftoverForRooms, quoteStay, todayIso } from "@/lib/inventory";
import { deskFor } from "@/lib/hotel-desk";
import { getSeededConsensus } from "@/lib/youtube/get-seeded";
import { useStayInventory } from "@/lib/use-occupancy";
import { cn } from "@/lib/utils";
import { getJourney } from "@/lib/transport";
import { guestSwaps, writeMeta } from "@/lib/booking-meta";
import {
  arrivalPinLabel,
  defaultTravelPlan,
  EMPTY_TRAVEL,
  patchTravelDraft,
  pickupChargeInr,
  quoteTravel,
  type TravelPlan,
} from "@/lib/travel-plan";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/trip/$id")({
  component: TripDetail,
  head: ({ params }) => ({
    meta: [{ title: pageTitle(getPackage(params.id)?.name ?? "Stay") }],
  }),
});

function TripDetail() {
  const { id } = Route.useParams();
  const pkg = getPackage(id);
  const nav = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState(false);
  const [nights, setNights] = useState(pkg?.nights ?? 1);
  const [roomId, setRoomId] = useState(pkg?.rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState(() => todayIso());
  const [liveTrust, setLiveTrust] = useState<number | null>(null);
  const [liveBreakdown, setLiveBreakdown] = useState<TrustScoreBreakdown | null>(null);
  const [travel, setTravel] = useState<TravelPlan>(EMPTY_TRAVEL);
  /** Set when a saved / linked check-in had already passed and Stay moved it to today. */
  const [dateMoved, setDateMoved] = useState<string | null>(null);
  const inventory = useStayInventory(pkg?.id, checkIn, nights);
  const inventoryKnown = inventory === "ready";

  useEffect(() => {
    if (!pkg) return;
    const briefNow = loadBriefWithDates();
    const pending = loadPending();
    // Coming back from Travellers / Checkout: the cart for this stay wins over the brief,
    // so the guest's room, nights, add-ons, and date survive Back.
    const cart = pending?.packageId === pkg.id ? pending : null;
    setNights(clampNights(pkg, cart?.nights ?? briefNow.nights));
    const recommended = recommendRooms(pkg.rooms, briefNow.style);
    const cartRoom = cart?.roomId && pkg.rooms.some((r) => r.id === cart.roomId) ? cart.roomId : "";
    setRoomId(cartRoom || recommended[0]?.id || pkg.rooms[0]!.id);
    setSwaps(cart ? guestSwaps(cart.swaps) : {});
    setBooking(false);
    const wanted = cart?.checkIn ?? briefNow.checkIn ?? pending?.checkIn;
    const nextCheckIn = checkInOnOrAfterToday(wanted);
    setCheckIn(nextCheckIn);
    setDateMoved(wanted && wanted !== nextCheckIn ? wanted : null);
    setTravel(defaultTravelPlan(pkg.id, briefNow, cart?.travel));
    // Only when the stay changes. Catalog overlays rebuild `pkg` every render,
    // and depending on that object wiped the room the guest had just picked.
  }, [pkg?.id]);

  useEffect(() => {
    if (!pkg || !inventoryKnown) return;
    const leftover = leftoverForRooms(pkg.id, checkIn, nights, [], true);
    setRoomId((current) => {
      if (leftover[current] && !leftover[current].soldOut) return current;
      const briefStyle = loadBriefWithDates().style;
      const recommended = recommendRooms(pkg.rooms, briefStyle);
      const next =
        recommended.find((r) => leftover[r.id] && !leftover[r.id]!.soldOut) ??
        pkg.rooms.find((r) => leftover[r.id] && !leftover[r.id]!.soldOut);
      return next?.id ?? current;
    });
  }, [pkg, inventoryKnown, checkIn, nights]);

  const gallery = useMemo(() => {
    if (!pkg) return [] as string[];
    const list = pkg.images.filter(Boolean);
    if (pkg.image && !list.includes(pkg.image)) return [pkg.image, ...list];
    return list.length ? list : pkg.image ? [pkg.image] : [];
  }, [pkg]);
  const [openToken, setOpenToken] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [frame, setFrame] = useState({ src: "", position: 1, total: 0 });

  useEffect(() => {
    if (!gallery.length) return;
    setFrame((prev) =>
      prev.src ? prev : { src: gallery[0]!, position: 1, total: gallery.length },
    );
  }, [gallery]);

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
    inventoryKnown,
  });
  const price = quote?.perPerson ?? 0;
  const brief = loadBriefWithDates();
  const amenities = stayAmenityFacts(pkg);
  const journey = getJourney(pkg.id, brief.origin, brief.arriveBy);
  const travelQuote = quoteTravel(pkg.id, { ...brief, checkIn, nights }, travel);
  const pickupInr = pickupChargeInr(pkg.id, { ...travel, arriveBy: brief.arriveBy, origin: brief.origin });
  const trust = computeTrustScore(pkg);
  const seedConsensus = getSeededConsensus(pkg.id);
  const nightlyRate = quote && quote.nights > 0 ? Math.round(quote.perPerson / quote.nights) : pkg.pricePerNight + (room.deltaPerNight || 0);
  const desk = deskFor(pkg.id);
  const gstLine = desk.gstin
    ? `GSTIN ${desk.gstin} · taxes included at checkout`
    : "GST as billed by the hotel at checkout";
  const refundLabel = refundPolicyFor(checkIn).label;
  const rateLine =
    inventory === "loading"
      ? "Checking rooms for these dates"
      : inventory === "failed" || quote?.unknown
        ? "Couldn't check rooms for these dates"
        : !quote?.released
          ? "On request — the hotel has not released these nights"
          : quote.available
            ? `${formatMoney(nightlyRate)} / night · ${room.name} · ${nightsPhrase(nights)} · sleeps ${room.occupancy}`
            : "Sold out — pick another date";
  const finePrint = quote?.available
    ? `Stay total ${formatMoney(price)}${pickupInr > 0 ? ` · pickup ${formatMoney(pickupInr)} at checkout` : ""} · ${gstLine} · ${refundLabel}`
    : null;

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
    setBooking(true);
    // Session still loading: Travellers waits on RequireAuth and sends to sign-in if needed.
    if (isPending) {
      void nav({ to: "/travelers" });
      return;
    }
    if (!user) {
      saveNext("/travelers");
      void nav({ to: "/login", search: { next: "/travelers" } });
      return;
    }
    void nav({ to: "/travelers" });
  };

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
        <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-elevated/95 px-3 py-1 text-xs font-medium text-fg">
          {frame.position} / {frame.total}
          {frame.total > 0 && frame.total < 4 ? " · hotel-published, limited set" : ""}
        </span>
        {pin ? (
          <span className="pointer-events-none absolute left-3 top-12 z-20 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-fg">
            <MapPin className="size-3" />
            {pin}
          </span>
        ) : null}
        <div className="absolute right-3 top-3 z-20">
          <LikeButton id={pkg.id} />
        </div>
        {gallery.length > 1 ? (
          <div className="absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-3">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full bg-elevated/95 text-fg"
              aria-label="Previous photo"
              onClick={() => setPhotoIndex((n) => (n - 1 + gallery.length) % gallery.length)}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full bg-elevated/95 text-fg"
              aria-label="Next photo"
              onClick={() => setPhotoIndex((n) => (n + 1) % gallery.length)}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : null}
      </StayCover>
      <div id="stay-photos">
      <PropertyMedia
        id={pkg.id}
        name={pkg.name}
        images={pkg.images}
        roomImages={pkg.rooms.flatMap((room) => room.images ?? (room.image ? [room.image] : []))}
        videos={pkg.videos}
        hideHero
        activeIndex={photoIndex}
        onActiveIndex={setPhotoIndex}
        onPhoto={(src, position, total) => setFrame({ src, position, total })}
        openToken={openToken}
      />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-64 md:pb-32">
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

        {dateMoved ? (
          <p className="mt-6 rounded-md border border-border bg-elevated px-3 py-2 text-sm text-muted" role="status">
            Your saved check-in ({formatCheckInLabel(dateMoved)}) has already passed, so we moved it to{" "}
            {formatCheckInLabel(checkIn)}. Pick another date below if you prefer.
          </p>
        ) : null}
        <StayQuoteCard
          quote={quote}
          checkIn={checkIn}
          minDate={todayIso()}
          onCheckIn={(next) => {
            setCheckIn(next);
            setDateMoved(null);
          }}
        />

        <RoomPicker
          rooms={pkg.rooms}
          selectedId={room.id}
          onSelect={setRoomId}
          pricePerNight={pkg.pricePerNight}
          leftover={leftoverForRooms(pkg.id, checkIn, nights, [], inventoryKnown)}
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
      <div className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-elevated/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:bottom-0 md:pb-3">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-left">
            <p className="font-display text-xl tabular-nums">
              <RollingPrice value={price} />
            </p>
            <p className="mt-1 text-left text-xs leading-snug text-muted">{rateLine}</p>
            {finePrint ? (
              <p className="mt-0.5 text-left text-[0.65rem] leading-snug text-subtle">{finePrint}</p>
            ) : null}
          </div>
          <Button
            size="lg"
            className="shrink-0 whitespace-nowrap"
            onClick={goBook}
            disabled={isPending || !quote?.available}
          >
            <TextSwap text={booking ? "Traveller details…" : "Book this stay"} shimmer={booking} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
