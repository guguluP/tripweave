import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, ShakeField, ShakeSelect, Stagger } from "@/components/motion";
import { pushBanner } from "@/lib/banners";
import { DIGIYATRA_GUIDE, getTransportForPackage } from "@/lib/transport";
import { DIGILOCKER_STATUS } from "@/lib/digilocker";
import {
  digilockerDemoTraveler,
  emptyTraveler,
  GENDER_LABELS,
  ID_LABELS,
  loadTravelers,
  saveTravelers,
  validateTravelers,
  type Gender,
  type IdType,
  type Traveler,
  type TravelerErrors,
} from "@/lib/travelers";
import { formatMoney, getPackage, loadPending, priceWithSwaps } from "@/lib/packages";

export const Route = createFileRoute("/travelers")({ component: TravelersPage });

function TravelersPage() {
  return (
    <RequireAuth next="/travelers" fallback={<Shell><Skeleton className="m-10 h-40" /></Shell>}>
      <TravelersInner />
    </RequireAuth>
  );
}

function TravelersInner() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [count, setCount] = useState(2);
  const [list, setList] = useState<Traveler[]>([emptyTraveler(), emptyTraveler()]);
  const [errors, setErrors] = useState<TravelerErrors[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [digiOpen, setDigiOpen] = useState(false);

  useEffect(() => {
    const pending = loadPending();
    setPackageId(pending?.packageId ?? null);
    setSwaps(pending?.swaps ?? {});
    const saved = loadTravelers();
    if (saved.length > 0) {
      setList(saved);
      setCount(saved.length);
    }
    setReady(true);
  }, []);

  const pkg = packageId ? getPackage(packageId) : undefined;
  const transport = packageId ? getTransportForPackage(packageId) : null;
  const perPerson = pkg ? priceWithSwaps(pkg, swaps) : 0;
  const total = perPerson * count;

  const syncCount = (n: number) => {
    const next = Math.min(8, Math.max(1, n));
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

  const applyDigiDemo = (index: number) => {
    update(index, digilockerDemoTraveler());
    setDigiOpen(false);
    pushBanner({
      title: "Demo DigiLocker fill",
      body: "Sample Aadhaar-style identity applied. Live DigiLocker needs partner credentials.",
      tone: "info",
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
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Stagger>
            <p className="eyebrow">Before payment</p>
            <h1 className="mt-2 font-display text-4xl">Traveller details</h1>
            <p className="mt-3 text-sm text-muted">
              Essential details for hotel registration. Names should match government ID.
            </p>
          </Stagger>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div className="w-36">
              <ShakeField
                label="Guests"
                type="number"
                min={1}
                max={8}
                value={count}
                onChange={(e) => syncCount(Number(e.target.value) || 1)}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setDigiOpen(true)}>
              DigiLocker assist
            </Button>
          </div>

          {digiOpen ? (
            <Card className="mt-4 space-y-3 border-primary/20 bg-elevated p-4 shadow-none">
              <p className="text-sm font-medium">DigiLocker</p>
              <p className="text-sm text-muted">{DIGILOCKER_STATUS.reason}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => applyDigiDemo(0)}>
                  Demo fill guest 1
                </Button>
                <Button type="button" size="sm" variant="outline" asChild>
                  <a href={DIGILOCKER_STATUS.citizenApp} target="_blank" rel="noreferrer">
                    Open DigiLocker
                  </a>
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setDigiOpen(false)}>
                  Close
                </Button>
              </div>
              <p className="text-xs text-subtle">
                Partner onboarding:{" "}
                <a className="underline" href={DIGILOCKER_STATUS.portal} target="_blank" rel="noreferrer">
                  API Setu DigiLocker
                </a>
              </p>
            </Card>
          ) : null}

          <div className="mt-8 grid gap-6">
            {list.slice(0, count).map((t, i) => {
              const err = errors[i] ?? {};
              return (
                <Card key={i} className="space-y-3 p-5 shadow-none">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl">
                      Guest {i + 1}
                      {i === 0 ? " · primary" : ""}
                    </h2>
                    {t.identitySource !== "manual" ? (
                      <span className="text-xs text-ok">
                        {t.identitySource === "digilocker_demo" ? "Demo DigiLocker" : "DigiLocker"}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ShakeField
                      label="Full name (as on ID)"
                      value={t.fullName}
                      error={err.fullName}
                      shakeKey={shakeKey}
                      onChange={(e) => update(i, { fullName: e.target.value, identitySource: "manual" })}
                    />
                    <ShakeField
                      label="Mobile"
                      inputMode="tel"
                      placeholder="10-digit mobile"
                      value={t.phone}
                      error={err.phone}
                      shakeKey={shakeKey}
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
                      onChange={(e) => update(i, { email: e.target.value })}
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
                      label="Nationality (ISO)"
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
                      label="ID number"
                      value={t.idNumber}
                      error={err.idNumber}
                      shakeKey={shakeKey}
                      onChange={(e) => update(i, { idNumber: e.target.value, identitySource: "manual" })}
                    />
                    <ShakeField
                      label="Emergency contact name"
                      value={t.emergencyName}
                      onChange={(e) => update(i, { emergencyName: e.target.value })}
                    />
                    <ShakeField
                      label="Emergency mobile"
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
                  </div>
                  <ShakeField
                    label="Special requests (optional)"
                    value={t.specialRequests}
                    onChange={(e) => update(i, { specialRequests: e.target.value })}
                  />
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" size="lg" onClick={onContinue}>
              Continue to payment
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={`/trip/${pkg.id}`}>Back to stay</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden shadow-none">
            <img src={pkg.image} alt="" className="h-36 w-full object-cover" />
            <div className="p-5">
              <h2 className="font-display text-xl">{pkg.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {pkg.nights} nights · {pkg.neighborhood}
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

          {transport ? (
            <Card className="space-y-3 p-5 shadow-none">
              <p className="eyebrow">Best way to the property</p>
              <h3 className="font-display text-lg">{transport.best.mode}</h3>
              <p className="text-sm text-muted">{transport.best.why}</p>
              <dl className="grid gap-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Time</dt>
                  <dd className="text-right">{transport.best.duration}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Typical cost</dt>
                  <dd className="text-right">{transport.best.costHint}</dd>
                </div>
              </dl>
              {transport.best.tips ? (
                <p className="text-xs text-subtle">{transport.best.tips}</p>
              ) : null}
              <p className="text-xs text-subtle">{transport.localNote}</p>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted">From BBI airport</p>
                <ul className="mt-1 space-y-1 text-xs text-subtle">
                  {transport.fromAirport.map((leg) => (
                    <li key={leg.mode}>
                      <span className="text-foreground">{leg.mode}</span> — {leg.duration} ·{" "}
                      {leg.costHint}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs font-medium text-muted">From Puri station</p>
                <ul className="mt-1 space-y-1 text-xs text-subtle">
                  {transport.fromStation.map((leg) => (
                    <li key={leg.mode}>
                      <span className="text-foreground">{leg.mode}</span> — {leg.duration} ·{" "}
                      {leg.costHint}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ) : null}

          <Card className="space-y-2 p-5 shadow-none">
            <p className="eyebrow">DigiYatra · {DIGIYATRA_GUIDE.airportCode}</p>
            <h3 className="font-display text-lg">Airport only</h3>
            <p className="text-sm text-muted">{DIGIYATRA_GUIDE.summary}</p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-subtle">
              {DIGIYATRA_GUIDE.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="text-xs text-subtle">{DIGIYATRA_GUIDE.note}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={DIGIYATRA_GUIDE.appLinks.android} target="_blank" rel="noreferrer">
                  Android app
                </a>
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={DIGIYATRA_GUIDE.appLinks.ios} target="_blank" rel="noreferrer">
                  iOS app
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
