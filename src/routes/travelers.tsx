import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { DigilockerFlow } from "@/components/digilocker-flow";
import { DigiYatraPanel, TransportPanel } from "@/components/transport-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, ShakeField, ShakeSelect, Stagger } from "@/components/motion";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pushBanner } from "@/lib/banners";
import { getJourney } from "@/lib/transport";
import {
  DIGIYATRA_LABELS,
  GENDER_LABELS,
  ID_LABELS,
  emptyTraveler,
  loadTravelers,
  saveTravelers,
  travelerInitials,
  validateTravelers,
  type DigiYatraStatus,
  type Gender,
  type IdType,
  type Traveler,
  type TravelerErrors,
} from "@/lib/travelers";
import { formatMoney, getPackage, getRoom, loadBrief, loadPending, nightsPhrase, stayTotal } from "@/lib/packages";
import { quoteStay } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/travelers")({ component: TravelersPage });

function TravelersPage() {
  return (
    <RequireAuth next="/travelers" fallback={<Shell><Skeleton className="m-10 h-40" /></Shell>}>
      <TravelersInner />
    </RequireAuth>
  );
}

function Stepper() {
  return (
    <ol className="flex items-center gap-2 text-xs font-medium text-subtle">
      <li className="text-muted">Stay</li>
      <li aria-hidden className="h-px w-6 bg-border" />
      <li className="text-primary">Travellers</li>
      <li aria-hidden className="h-px w-6 bg-border" />
      <li>Pay</li>
    </ol>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-5 min-w-0">
      <legend className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{title}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function TravelersInner() {
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [nights, setNights] = useState(1);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [count, setCount] = useState(2);
  const [list, setList] = useState<Traveler[]>([emptyTraveler(), emptyTraveler()]);
  const [errors, setErrors] = useState<TravelerErrors[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [digiGuest, setDigiGuest] = useState<number | null>(null);

  useEffect(() => {
    const pending = loadPending();
    setPackageId(pending?.packageId ?? null);
    setSwaps(pending?.swaps ?? {});
    setNights(pending?.nights ?? 1);
    setRoomId(pending?.roomId ?? "");
    setCheckIn(pending?.checkIn ?? "");
    const saved = loadTravelers();
    const pendingPkg = pending?.packageId ? getPackage(pending.packageId) : undefined;
    const pendingRoom = pendingPkg ? getRoom(pendingPkg, pending?.roomId) : undefined;
    const cap = pendingRoom?.occupancy ?? 8;
    if (saved.length > 0) {
      const sliced = saved.slice(0, cap);
      setList(sliced);
      setCount(sliced.length);
    } else if (user?.primaryEmail || user?.displayName) {
      setList([
        emptyTraveler({
          fullName: user.displayName ?? "",
          email: user.primaryEmail ?? "",
        }),
      ]);
      setCount(1);
    }
    setReady(true);
  }, [user?.displayName, user?.primaryEmail]);

  const pkg = packageId ? getPackage(packageId) : undefined;
  const brief = loadBrief();
  const journey = packageId ? getJourney(packageId, brief.origin, brief.arriveBy) : null;
  const room = pkg ? getRoom(pkg, roomId) : undefined;
  const maxGuests = room?.occupancy ?? 8;
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
  const perPerson = quote?.perPerson ?? (pkg ? stayTotal(pkg, nights, room?.id, swaps) : 0);
  const total = perPerson * Math.min(count, maxGuests);

  const syncCount = (n: number) => {
    const cap = room?.occupancy ?? 8;
    const next = Math.min(cap, Math.max(1, n));
    setCount(next);
    setList((prev) => {
      if (prev.length === next) return prev;
      if (prev.length < next) {
        return [...prev, ...Array.from({ length: next - prev.length }, () => emptyTraveler())];
      }
      return prev.slice(0, next);
    });
  };

  const update = (index: number, patch: Partial<Traveler>) => {
    setList((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const onContinue = () => {
    if (room && count > room.occupancy) {
      pushBanner({
        title: `This room sleeps ${room.occupancy}`,
        body: "Remove extra guests or pick a larger room.",
        tone: "danger",
      });
      return;
    }
    const result = validateTravelers(list.slice(0, count));
    setErrors(result.errors);
    if (!result.ok) {
      setShakeKey((k) => k + 1);
      pushBanner({ title: "Check traveller details", body: "Fill required fields for each guest.", tone: "danger" });
      return;
    }
    saveTravelers(list.slice(0, count));
    try {
      window.localStorage.setItem("tripweave-traveler-count", String(count));
    } catch {
      /* ignore */
    }
    pushBanner({ title: "Travellers saved", tone: "ok" });
    void navigate({ to: "/checkout" });
  };

  const applyDigi = (index: number, filled: Traveler) => {
    setList((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              ...filled,
              specialRequests: t.specialRequests,
              emergencyName: t.emergencyName,
              emergencyPhone: t.emergencyPhone,
              digiYatra: t.digiYatra,
            }
          : t,
      ),
    );
    pushBanner({
      title: "DigiLocker details applied",
      body: `${filled.fullName} filled from issued documents.`,
      tone: "ok",
    });
  };

  if (!ready) {
    return (
      <Shell>
        <Skeleton className="mx-auto mt-16 h-48 max-w-3xl" />
      </Shell>
    );
  }

  if (!pkg) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-3xl">No stay selected</h1>
          <p className="mt-3 text-muted">Choose a hotel first, then add traveller details.</p>
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
              Names must match government ID. DigiLocker fills the form only — we do not keep
              documents. After you pay, we store last 4 digits of ID until 14 days after checkout,
              then delete guest details. DigiYatra is only for Bhubaneswar airport.
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
              DigiLocker assist
            </Button>
          </div>
          {count >= maxGuests ? (
            <p className="mt-3 text-xs text-muted">
              This room sleeps {maxGuests}. Extra guests need a larger room — occupancy is a hard cap.
            </p>
          ) : null}

          <div className="mt-8 grid gap-5">
            {list.slice(0, count).map((t, i) => {
              const err = errors[i] ?? {};
              const filled = t.identitySource !== "manual";
              return (
                <Card key={i} className="p-5 shadow-none">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
                        {travelerInitials(t, i)}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-display text-xl">
                          Guest {i + 1}
                          {i === 0 ? " · primary" : ""}
                        </h2>
                        {filled ? (
                          <p className="text-xs text-ok">
                            {t.identitySource === "digilocker_demo" ? "Sandbox DigiLocker" : "DigiLocker"}
                            {t.issuedDocs[0] ? ` · ${t.issuedDocs[0].label}` : ""}
                          </p>
                        ) : (
                          <p className="text-xs text-subtle">Manual entry</p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setDigiGuest(i)}
                    >
                      Fill from DigiLocker
                    </Button>
                  </div>

                  <FieldGroup title="Identity">
                    <ShakeField
                      className="sm:col-span-2"
                      label="Full name (as on ID)"
                      value={t.fullName}
                      error={err.fullName}
                      shakeKey={shakeKey}
                      autoComplete="name"
                      onChange={(e) => update(i, { fullName: e.target.value, identitySource: "manual" })}
                    />
                    <ShakeField
                      label="Date of birth"
                      type="date"
                      value={t.dateOfBirth}
                      error={err.dateOfBirth}
                      shakeKey={shakeKey}
                      onChange={(e) => update(i, { dateOfBirth: e.target.value })}
                    />
                    <ShakeSelect
                      label="Gender"
                      value={t.gender}
                      onChange={(e) => update(i, { gender: e.target.value as Gender })}
                    >
                      {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
                        <option key={g} value={g}>
                          {GENDER_LABELS[g]}
                        </option>
                      ))}
                    </ShakeSelect>
                    <ShakeField
                      label="Nationality"
                      value={t.nationality}
                      error={err.nationality}
                      shakeKey={shakeKey}
                      onChange={(e) =>
                        update(i, { nationality: e.target.value.toUpperCase().slice(0, 2) })
                      }
                    />
                    <ShakeSelect
                      label="ID type"
                      value={t.idType}
                      onChange={(e) => update(i, { idType: e.target.value as IdType })}
                    >
                      {(Object.keys(ID_LABELS) as IdType[]).map((id) => (
                        <option key={id} value={id}>
                          {ID_LABELS[id]}
                        </option>
                      ))}
                    </ShakeSelect>
                    <ShakeField
                      className="sm:col-span-2"
                      label="ID number"
                      value={t.idNumber}
                      error={err.idNumber}
                      shakeKey={shakeKey}
                      onChange={(e) => update(i, { idNumber: e.target.value, identitySource: "manual" })}
                    />
                  </FieldGroup>

                  <FieldGroup title="Contact">
                    <ShakeField
                      label="Mobile"
                      inputMode="tel"
                      placeholder="10-digit mobile"
                      value={t.phone}
                      error={err.phone}
                      shakeKey={shakeKey}
                      autoComplete="tel"
                      onChange={(e) =>
                        update(i, { phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                    />
                    <ShakeField
                      label="Email"
                      type="email"
                      value={t.email}
                      error={err.email}
                      shakeKey={shakeKey}
                      autoComplete="email"
                      onChange={(e) => update(i, { email: e.target.value })}
                    />
                  </FieldGroup>

                  <FieldGroup title="Emergency">
                    <ShakeField
                      label="Contact name"
                      value={t.emergencyName}
                      autoComplete="off"
                      onChange={(e) => update(i, { emergencyName: e.target.value })}
                    />
                    <ShakeField
                      label="Mobile"
                      inputMode="tel"
                      value={t.emergencyPhone}
                      error={err.emergencyPhone}
                      shakeKey={shakeKey}
                      onChange={(e) =>
                        update(i, {
                          emergencyPhone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                    />
                    <ShakeField
                      className="sm:col-span-2"
                      label="Special requests (optional)"
                      value={t.specialRequests}
                      placeholder="Diet, accessibility, room preference"
                      onChange={(e) => update(i, { specialRequests: e.target.value })}
                    />
                  </FieldGroup>

                  {t.issuedDocs.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {t.issuedDocs.map((d) => (
                        <li
                          key={`${d.label}-${d.idMasked}`}
                          className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted"
                        >
                          {d.label} · {d.idMasked}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-sm font-medium">DigiYatra for BBI</p>
                    <p className="mt-1 text-xs text-subtle">
                      Optional. Airport e-gates only — does not replace hotel ID.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.keys(DIGIYATRA_LABELS) as DigiYatraStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={cn(
                            "min-h-11 min-w-[7.5rem] flex-1 rounded-md border px-3 text-center text-xs font-medium",
                            t.digiYatra === status
                              ? "border-primary/40 bg-primary/5 text-fg"
                              : "border-border bg-elevated text-muted",
                          )}
                          onClick={() => update(i, { digiYatra: status })}
                        >
                          {DIGIYATRA_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="sticky bottom-0 z-10 mt-8 -mx-4 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <div className="flex flex-wrap gap-3">
              <Button type="button" size="lg" onClick={onContinue}>
                Continue to payment
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/trip/$id" params={{ id: pkg.id }}>Back to stay</Link>
              </Button>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden shadow-none">
            <img src={pkg.image} alt="" className="h-36 w-full object-cover" />
            <div className="p-5">
              <h2 className="font-display text-xl">{pkg.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {nightsPhrase(nights)} · {room?.name ?? "Room"} · {pkg.neighborhood}
              </p>
              <p className="mt-3 text-sm">
                Est. total{" "}
                <span className="font-medium tabular-nums">
                  <DigitPop value={formatMoney(total)} />
                </span>{" "}
                · {count} guest{count === 1 ? "" : "s"}
              </p>
            </div>
          </Card>

          {journey ? <TransportPanel journey={journey} /> : null}
          <DigiYatraPanel />
        </aside>
      </div>

      {digiGuest !== null ? (
        <DigilockerFlow
          guestIndex={digiGuest}
          guestLabel={`guest ${digiGuest + 1}`}
          onClose={() => setDigiGuest(null)}
          onApply={(filled) => {
            applyDigi(digiGuest, filled);
            setDigiGuest(null);
          }}
        />
      ) : null}
    </Shell>
  );
}
