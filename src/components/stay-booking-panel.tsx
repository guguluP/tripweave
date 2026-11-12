import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DigitPop, TextSwap } from "@/components/motion";
import { RollingPrice } from "@/components/motion/rolling-price";
import { TrustMeter } from "@/components/trust-meter";
import { AskTripWeaveButton } from "@/components/ask-sheet";
import { CheckInField, formatCheckInLabel } from "@/components/stay-quote";
import { clampNights, nightsPhrase, type StayPackage } from "@/lib/packages";
import { stayQuoteLine, todayIso, type StayQuote } from "@/lib/inventory";
import type { TrustScoreBreakdown } from "@/lib/trust-score";
import type { TravelPlan } from "@/lib/travel-plan";
import { loadTravelers } from "@/lib/travelers";

/** Desktop-only booking card for the stay split layout. */
export function StayBookingPanel({
  pkg,
  price,
  rateLine,
  finePrint,
  nights,
  onNights,
  checkIn,
  onCheckIn,
  dateMoved,
  quote,
  checking,
  trustScore,
  trustBreakdown,
  youtubeSources,
  roomOccupancy,
  party,
  roomFits,
  fitError,
  partyLabel,
  booking,
  bookDisabled,
  onBook,
  arriveBy,
  includePickup,
  onRequestCar,
  roomId,
}: {
  pkg: StayPackage;
  price: number;
  rateLine: string;
  finePrint: string | null;
  nights: number;
  onNights: (nights: number) => void;
  checkIn: string;
  onCheckIn: (iso: string) => void;
  dateMoved: string | null;
  quote: StayQuote | null;
  checking: boolean;
  trustScore: number;
  trustBreakdown: TrustScoreBreakdown;
  youtubeSources: number;
  roomOccupancy: number;
  party: number;
  roomFits: boolean;
  fitError: string | null;
  partyLabel: string;
  booking: boolean;
  bookDisabled: boolean;
  onBook: () => void;
  arriveBy: TravelPlan["arriveBy"] | string;
  includePickup: boolean;
  onRequestCar: () => void;
  roomId: string;
}) {
  return (
    <section
      className="rounded-xl border border-border bg-elevated p-4 shadow-soft"
      aria-label="Book this stay"
    >
      <p className="font-display text-3xl tabular-nums leading-none">
        <RollingPrice value={price} />
      </p>
      <p className="mt-2 text-xs leading-snug text-muted">{rateLine}</p>
      <p className="mt-1 text-xs text-muted">
        {partyLabel} · <Link to="/plan" className="underline">change</Link>
      </p>

      <div className="mt-4 rounded-lg border border-border px-3 py-2">
        <TrustMeter
          score={trustScore}
          youtubeSources={youtubeSources}
          breakdown={trustBreakdown}
          compact
        />
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium">Nights</p>
        <div className="mt-2 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onNights(clampNights(pkg, nights - 1))}
            aria-label="Fewer nights"
            disabled={nights <= pkg.nightsMin}
          >
            −
          </Button>
          <span className="min-w-10 text-center font-display text-2xl tabular-nums">
            <DigitPop value={nights} />
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onNights(clampNights(pkg, nights + 1))}
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
        <p className="mt-4 rounded-md border border-border bg-bg px-3 py-2 text-sm text-muted" role="status">
          Your saved check-in ({formatCheckInLabel(dateMoved)}) has already passed, so we moved it to{" "}
          {formatCheckInLabel(checkIn)}. Pick another date below if you prefer.
        </p>
      ) : null}

      <div className="mt-4">
        <CheckInField checkIn={checkIn} onCheckIn={onCheckIn} minDate={todayIso()} />
        {quote ? (
          <p className="mt-2 text-xs text-muted" aria-live="polite">
            {stayQuoteLine(quote, checking)}
          </p>
        ) : null}
      </div>

      {!roomFits || fitError ? (
        <p className="mt-3 text-xs text-danger" role="alert">
          {fitError ?? `This room sleeps ${roomOccupancy} · too small for ${party}.`}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <Button size="lg" className="w-full whitespace-nowrap" onClick={onBook} disabled={bookDisabled}>
          <TextSwap text={booking ? "Opening checkout…" : "Book this stay"} shimmer={booking} />
        </Button>
        <AskTripWeaveButton
          hotelName={pkg.name}
          nationalities={loadTravelers().map((guest) => guest.nationality)}
          packageId={pkg.id}
          roomId={roomId}
          checkIn={checkIn}
          nights={nights}
          arriveBy={arriveBy}
          includePickup={includePickup}
          amountInr={price}
          onRequestCar={onRequestCar}
        />
      </div>
      {finePrint ? <p className="mt-3 text-[0.65rem] leading-snug text-subtle">{finePrint}</p> : null}
    </section>
  );
}
