import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/shell";
import { DigiLockerFlow } from "@/components/digilocker-flow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DigiLockerStatusBanner } from "@/components/digilocker-status";
import { DigitPop, Stagger, TextSwap } from "@/components/motion";
import { DIGILOCKER_STATUS } from "@/lib/digilocker";
import {
  DIGIYATRA_LABELS,
  emptyTraveler,
  loadTravelers,
  saveTravelers,
  validateTravelers,
  type DigiYatraStatus,
  type Traveler,
} from "@/lib/travelers";
import {
  clampNights,
  formatMoney,
  getPackage,
  getRoom,
  loadBrief,
  loadPending,
  nightsPhrase,
  stayTotal,
} from "@/lib/packages";
import { quoteStay } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/travelers")({ component: TravelersPage });

function Stepper() {
  const steps = ["Stay", "Travellers", "Pay"] as const;
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full border text-[0.65rem] font-semibold",
              i === 1
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-elevated",
            )}
          >
            {i + 1}
          </span>
          <span className={i === 1 ? "font-medium text-fg" : undefined}>{label}</span>
          {i < steps.length - 1 ? <span className="text-subtle">/</span> : null}
        </li>
      ))}
    </ol>
  );
}

function TravelersPage() {
  return <TravelersInner />;
}

function TravelersInner() {
  const nav = useNavigate();
  const pending = loadPending();
  const pkg = pending ? getPackage(pending.packageId) : undefined;
  const room = pkg ? getRoom(pkg, pending?.roomId) : undefined;
  const nights = pkg && pending ? clampNights(pkg, pending.nights) : 1;
  const swaps = pending?.swaps ?? {};
  const checkIn = pending?.checkIn;
  const quote =
    pkg && checkIn
      ? quoteStay({
          packageId: pkg.id,
          roomId: room?.id,
          checkIn,
          nights,
          swaps,
        })
      : null;
  const price = quote?.perPerson ?? (pkg ? stayTotal(pkg, nights, room?.id, swaps) : 0);
  const maxGuests = room?.occupancy ?? 8;

  const [guests, setGuests] = useState<Traveler[]>(() => {
    const loaded = loadTravelers();
    if (loaded.length) return loaded.slice(0, maxGuests);
    return [emptyTraveler()];
  });
  const [errors, setErrors] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [digiGuest, setDigiGuest] = useState<number | null>(null);

  const count = guests.length;

  useEffect(() => {
    saveTravelers(guests);
    try {
      window.localStorage.setItem("tripweave-traveler-count", String(guests.length));
    } catch {
      /* ignore */
    }
  }, [guests]);

  const syncCount = (n: number) => {
    const next = Math.min(maxGuests, Math.max(1, n));
    setGuests((g) => {
      if (next === g.length) return g;
      if (next < g.length) return g.slice(0, next);
      return [...g, ...Array.from({ length: next - g.length }, () => emptyTraveler())];
    });
  };

  const update = (idx: number, patch: Partial<Traveler>) => {
    setGuests((g) => g.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const onContinue = () => {
    const v = validateTravelers(guests);
    if (!v.ok) {
      setErrors(v.message);
      return;
    }
    setErrors(null);
    setBusy(true);
    saveTravelers(guests);
    void nav({ to: "/checkout" });
  };

  if (!pkg || !pending) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-3xl">Nothing to book</h1>
          <p className="mt-3 text-muted">Pick a stay first, then add traveller details.</p>
          <Button asChild className="mt-6">
            <Link to="/plan">Find a hotel</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
        <div className="min-w-0">
          <Stagger>
            <Stepper />
            <p className="eyebrow mt-6">Before payment</p>
            <h1 className="mt-2 font-display text-4xl">Traveller details</h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Names must match government ID. Sample DigiLocker fills the form only — documents are
              not submitted to TripWeave. After you pay, we store last 4 digits of ID until 14 days
              after checkout, then delete guest details. DigiYatra status here is a guest note for
              Bhubaneswar airport, not an enrolment.
            </p>
            <p className="mt-3 max-w-xl rounded-md border border-border bg-elevated px-3 py-2 text-xs text-muted">
              Sandbox only — live DigiLocker is off. {DIGILOCKER_STATUS.reason}
            </p>
          </Stagger>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Guests · sleeps {maxGuests}</p>
              <div className="inline-flex h-11 items-center rounded-md border border-border bg-elevated">
                <button
                  type="button"
                  className="grid size-11 place-items-center text-muted hover:text-fg"
                  aria-label="Fewer guests"
                  onClick={() => syncCount(count - 1)}
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-10 text-center text-sm tabular-nums">{count}</span>
                <button
                  type="button"
                  className="grid size-11 place-items-center text-muted hover:text-fg disabled:opacity-40"
                  aria-label="More guests"
                  disabled={count >= maxGuests}
                  onClick={() => syncCount(count + 1)}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => setDigiGuest(0)}
            >
              <ShieldCheck className="size-4" />
              Sample DigiLocker
            </Button>
          </div>

          <DigiLockerStatusBanner className="mt-4" />

          <div className="mt-6 grid gap-4">
            {guests.map((g, idx) => (
              <Card key={g.id} className="p-4 shadow-none">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Guest {idx + 1}</p>
                  {idx === 0 ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => setDigiGuest(idx)}>
                      Fill from DigiLocker
                    </Button>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor={`name-${g.id}`}>Full name</Label>
                    <Input
                      id={`name-${g.id}`}
                      value={g.fullName}
                      autoComplete="name"
                      onChange={(e) => update(idx, { fullName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`phone-${g.id}`}>Phone</Label>
                    <Input
                      id={`phone-${g.id}`}
                      value={g.phone}
                      inputMode="tel"
                      autoComplete="tel"
                      onChange={(e) => update(idx, { phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`email-${g.id}`}>Email</Label>
                    <Input
                      id={`email-${g.id}`}
                      type="email"
                      value={g.email}
                      autoComplete="email"
                      onChange={(e) => update(idx, { email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`nat-${g.id}`}>Nationality</Label>
                    <Input
                      id={`nat-${g.id}`}
                      value={g.nationality}
                      onChange={(e) => update(idx, { nationality: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`idtype-${g.id}`}>ID type</Label>
                    <select
                      id={`idtype-${g.id}`}
                      className="h-11 rounded-md border border-border bg-elevated px-3 text-sm"
                      value={g.idType}
                      onChange={(e) => update(idx, { idType: e.target.value as Traveler["idType"] })}
                    >
                      <option value="aadhaar">Aadhaar</option>
                      <option value="passport">Passport</option>
                      <option value="dl">Driving licence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor={`idnum-${g.id}`}>ID number</Label>
                    <Input
                      id={`idnum-${g.id}`}
                      value={g.idNumber}
                      autoComplete="off"
                      onChange={(e) => update(idx, { idNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`emname-${g.id}`}>Emergency contact</Label>
                    <Input
                      id={`emname-${g.id}`}
                      value={g.emergencyName}
                      onChange={(e) => update(idx, { emergencyName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`emph-${g.id}`}>Emergency phone</Label>
                    <Input
                      id={`emph-${g.id}`}
                      value={g.emergencyPhone}
                      inputMode="tel"
                      onChange={(e) => update(idx, { emergencyPhone: e.target.value })}
                    />
                  </div>

                  <div className="mt-5 border-t border-border pt-4 sm:col-span-2">
                    <p className="text-sm font-medium">DigiYatra for BBI (guest note only)</p>
                    <p className="mt-1 text-xs text-subtle">
                      Optional personal reminder — not submitted to TripWeave, DigiYatra, or the hotel.
                      Airport e-gates only; does not replace hotel ID.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.keys(DIGIYATRA_LABELS) as DigiYatraStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => update(idx, { digiYatra: status })}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            g.digiYatra === status
                              ? "border-primary bg-primary text-primary-fg"
                              : "border-border bg-surface text-muted hover:text-fg",
                          )}
                        >
                          {DIGIYATRA_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {errors ? (
            <p className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {errors}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" size="lg" onClick={onContinue} disabled={busy}>
              <TextSwap text={busy ? "Opening checkout…" : "Continue to payment"} shimmer={busy} />
            </Button>
            <Button type="button" size="lg" variant="outline" asChild>
              <Link to={`/trip/${pkg.id}`}>Back to stay</Link>
            </Button>
          </div>
        </div>

        <Card className="h-fit overflow-hidden shadow-none">
          <img src={pkg.image} alt="" className="h-36 w-full object-cover" />
          <div className="p-5">
            <h2 className="font-display text-xl">{pkg.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {nightsPhrase(nights)} · {room?.name ?? "Room"} · {pkg.neighborhood}
            </p>
            <p className="mt-4 font-display text-2xl tabular-nums">
              <DigitPop value={formatMoney(price)} />
            </p>
            <p className="mt-1 text-xs text-muted">Room price for this stay — guest count does not multiply it.</p>
          </div>
        </Card>
      </div>

      {digiGuest != null ? (
        <DigiLockerFlow
          open
          onClose={() => setDigiGuest(null)}
          onFilled={(data) => {
            update(digiGuest, data);
            setDigiGuest(null);
          }}
        />
      ) : null}
    </Shell>
  );
}
