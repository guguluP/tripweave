import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AskTripWeaveButton } from "@/components/ask-sheet";
import { Choice } from "@/components/plan-city-menu";
import { CheckInField } from "@/components/stay-quote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DigitPop } from "@/components/motion";
import { addDays, todayIso } from "@/lib/inventory";
import { groupDayPlan, indianPassportChecklist } from "@/lib/group/day-plan";
import { formatIst } from "@/lib/group/deadlines";
import { statusLabel } from "@/lib/group/state";
import type { PublicGroup } from "@/lib/group/view";
import { formatMoney } from "@/lib/packages";
import { whatsappShareHref } from "@/lib/travel-plan";
import {
  cancelGroupTrip,
  castGroupVote,
  lockGroupStay,
  requestMemberOtp,
  sendGroupShares,
  verifyMemberOtp,
} from "@/lib/server/group-trips";

export function GroupTripView({
  state,
  token,
  onChange,
}: {
  state: PublicGroup;
  token?: string;
  onChange: (next: PublicGroup) => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const sharePath = token ? `${typeof window === "undefined" ? "" : window.location.origin}/g/${token}` : "";
  const party = state.adults + state.children;

  useEffect(() => {
    if (!token) return;
    let timer = 0;
    const pull = () => {
      void fetch(`/api/group/${token}/state?v=${state.version}`).then(async (res) => {
        if (res.status === 304) return;
        const body = (await res.json()) as { state?: PublicGroup };
        if (body.state && body.state.version !== state.version) onChange(body.state);
      }).catch(() => undefined);
    };
    const arm = () => {
      window.clearInterval(timer);
      timer = window.setInterval(pull, document.hidden ? 30000 : 4000);
    };
    arm();
    document.addEventListener("visibilitychange", arm);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", arm);
    };
  }, [token, state.version, onChange]);

  const days = state.lockedPackageId ? groupDayPlan(state.lockedPackageId, state.nights, state.elderly, state.checkIn) : [];
  const checklist = state.status === "hotel_confirmed" ? indianPassportChecklist(state.checkIn) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="eyebrow">Group trip · Puri</p>
      <h1 className="mt-2 font-display text-4xl">{state.title}</h1>
      <p className="mt-3 text-muted">
        {statusLabel(state.status)} · {state.checkIn} · {state.nights} nights · {party} people
        {state.elderly ? ` · ${state.elderly} elderly` : ""}
      </p>
      {state.payDeadlineAt ? <p className="mt-1 text-sm text-muted">Pay by {formatIst(state.payDeadlineAt)} IST</p> : null}
      {message ? <p className="mt-4 text-sm">{message}</p> : null}

      {state.role === "organiser" && sharePath ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(sharePath).then(() => setMessage("Link copied."))}>
            Copy link
          </Button>
          <Button asChild variant="outline">
            <a href={whatsappShareHref(`Puri darshan · ${state.checkIn} · ${party} people\n${sharePath}`)}>Share on WhatsApp</a>
          </Button>
        </div>
      ) : null}

      {state.role === "visitor" && token ? <JoinForm token={token} otpChannel={state.otpChannel} onChange={onChange} onMessage={setMessage} /> : null}

      <section className="mt-8 grid gap-3">
        {state.shortlist.map((stay) => {
          const votes = state.voteCounts.find((row) => row.packageId === stay.packageId)?.votes ?? 0;
          return (
            <article key={stay.packageId} className="rounded-xl border border-border bg-elevated p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{stay.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {stay.note} · {stay.rateKind}
                    {stay.templeMinutes != null ? ` · ${stay.templeMinutes} min to the temple` : ""}
                    {` · ${stay.trustScore}/100`}
                  </p>
                </div>
                <p className="text-right font-medium">{stay.totalInr ? formatMoney(stay.totalInr) : "—"}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{votes} votes · {stay.perHeadInr ? `${formatMoney(stay.perHeadInr)} per person` : ""}</p>
              {state.status === "voting" && state.role !== "visitor" && token ? (
                <Button className="mt-3" type="button" variant="outline" disabled={busy} onClick={() => {
                  setBusy(true);
                  void castGroupVote({ data: { token, packageId: stay.packageId } }).then((res) => {
                    setBusy(false);
                    if (res.ok) onChange(res.state);
                    else setMessage(res.message);
                  });
                }}>
                  Vote for this stay
                </Button>
              ) : null}
              {state.role === "organiser" && state.status === "voting" ? (
                <Button className="mt-3 ml-2" type="button" disabled={busy || !stay.lockable} onClick={() => {
                  setBusy(true);
                  void lockGroupStay({ data: { tripId: state.tripId, packageId: stay.packageId } }).then((res) => {
                    setBusy(false);
                    if (res.ok) onChange(res.state);
                    else setMessage(res.message);
                  });
                }}>
                  {stay.lockable ? "Lock this stay" : "Rooms not released"}
                </Button>
              ) : null}
            </article>
          );
        })}
      </section>

      {state.role === "organiser" && (state.status === "locked" || state.status === "collecting") && token ? (
        <ShareForm state={state} token={token} onChange={onChange} onMessage={setMessage} />
      ) : null}

      {token && state.role !== "visitor" ? (
        <div className="mt-6">
          <AskTripWeaveButton groupToken={token} packageId={state.lockedPackageId ?? undefined} checkIn={state.checkIn} nights={state.nights} hotelName={state.hotelName ?? undefined} />
        </div>
      ) : null}

      {state.me?.payUrl && state.me.shareStatus === "open" ? (
        <Button asChild className="mt-6">
          <a href={state.me.payUrl}>Pay {state.me.shareInr != null ? formatMoney(state.me.shareInr) : "my share"}</a>
        </Button>
      ) : null}
      {state.me?.shareStatus === "paid" ? <p className="mt-6 text-sm">Your share is paid.</p> : null}

      {state.people ? (
        <ul className="mt-8 grid gap-2 text-sm">
          {state.people.map((person) => (
            <li key={person.label} className="flex justify-between gap-3 border-b border-border py-2">
              <span>{person.label}{person.elderly ? " · elderly" : ""}{person.email ? ` · ${person.email}` : ""}{person.phone ? ` · ${person.phone}` : ""}</span>
              <span>{person.paid == null ? "" : person.paid ? "Paid" : "Pending"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-muted">{state.memberCount} people · {state.paidCount} paid · {state.pendingCount} pending</p>
      )}

      {days.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Days</h2>
          <ol className="mt-3 grid gap-3">
            {days.map((day) => (
              <li key={day.title} className="rounded-xl border border-border p-3">
                <p className="font-medium">{day.title}</p>
                <p className="mt-1 text-sm text-muted">{day.base}</p>
                {day.note ? <p className="mt-1 text-sm">{day.note}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {checklist.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Arrival checklist</h2>
          <p className="mt-1 text-sm text-muted">For Indian passports. A foreign passport uses the checklist on that guest's voucher.</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {checklist.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {state.vouchers.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Room vouchers</h2>
          <ul className="mt-3 grid gap-2">
            {state.vouchers.map((row) => (
              <li key={row.confirmationCode}>
                <Link to="/voucher/$code" params={{ code: row.confirmationCode }} className="text-sm font-medium">
                  {row.confirmationCode} · {formatMoney(row.amountInr)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {state.role === "organiser" && state.status !== "cancelled" && state.status !== "completed" ? (
        <Button className="mt-8" type="button" variant="outline" onClick={() => {
          void cancelGroupTrip({ data: { tripId: state.tripId } }).then((res) => {
            if (res.ok) onChange(res.state);
            else setMessage(res.message);
          });
        }}>
          Cancel the group
        </Button>
      ) : null}
    </div>
  );
}

function JoinForm({
  token,
  otpChannel,
  onChange,
  onMessage,
}: {
  token: string;
  otpChannel: PublicGroup["otpChannel"];
  onChange: (next: PublicGroup) => void;
  onMessage: (text: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [sent, setSent] = useState(false);
  const emailRequired = otpChannel === "email";
  const phoneRequired = otpChannel === "whatsapp" || whatsapp;
  return (
    <form className="mt-6 grid gap-3 rounded-xl border border-border p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!sent) {
        void requestMemberOtp({ data: { token, email, phone } }).then((res) => {
          if (!res.ok) onMessage(res.message);
          else {
            setSent(true);
            if (res.code) {
              setCode(res.code);
              onMessage(
                otpChannel === "email"
                  ? `We couldn't email the code. Your code is ${res.code}.`
                  : `Text messages are not on yet. Your code is ${res.code}.`,
              );
            } else {
              onMessage(otpChannel === "email" ? "Code sent to your email." : "Code sent.");
            }
          }
        });
        return;
      }
      void verifyMemberOtp({ data: { token, email, phone, code, displayName: name, whatsappOptIn: whatsapp, isElderly: false, needs: [] } }).then((res) => {
        if (res.ok) onChange(res.state);
        else onMessage(res.message);
      });
    }}>
      <p className="text-sm">
        TripWeave keeps your name and email{phoneRequired ? " and Indian mobile number" : " (and your mobile number, if you give one)"} to coordinate this trip, take your share, and tell the hotel the party size.
        These details are deleted 14 days after the trip ends. If the organiser removes you before you pay, they are erased then.
      </p>
      <label className="grid gap-1 text-sm font-medium">Name<Input value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="grid gap-1 text-sm font-medium">Email<Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required={emailRequired} /></label>
      <label className="grid gap-1 text-sm font-medium">Mobile{phoneRequired ? "" : " (optional)"}<Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required={phoneRequired} /></label>
      {sent ? <label className="grid gap-1 text-sm font-medium">Code<Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" required /></label> : null}
      <Choice
        selected={whatsapp}
        title={otpChannel === "email" ? "WhatsApp updates later (optional)" : "WhatsApp messages about this trip"}
        hint={otpChannel === "email" ? "Join codes are sent by email for now. Tick this if you want trip updates on WhatsApp once messaging is available." : undefined}
        onClick={() => setWhatsapp((on) => !on)}
      />
      <Button type="submit">{sent ? "Join" : "Send code"}</Button>
    </form>
  );
}

function ShareForm({ state, token, onChange, onMessage }: { state: PublicGroup; token: string; onChange: (next: PublicGroup) => void; onMessage: (text: string) => void }) {
  const today = todayIso();
  const [mode, setMode] = useState<"equal" | "per_family" | "organiser">("equal");
  const [payDay, setPayDay] = useState(addDays(today, 2));
  const [payHour, setPayHour] = useState(18);
  return (
    <form className="mt-8 grid gap-4 rounded-xl border border-border p-4" onSubmit={(event) => {
      event.preventDefault();
      const payDeadlineAt = new Date(`${payDay}T${String(payHour).padStart(2, "0")}:00:00+05:30`).toISOString();
      void sendGroupShares({ data: { tripId: state.tripId, token, mode, payDeadlineAt } }).then((res) => {
        if (res.ok) onChange(res.state);
        else onMessage(res.message);
      });
    }}>
      <h2 className="font-display text-2xl">Shares</h2>
      <fieldset>
        <legend className="text-sm font-medium">Split</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Choice selected={mode === "equal"} title="Equal" onClick={() => setMode("equal")} />
          <Choice selected={mode === "per_family"} title="Per family" onClick={() => setMode("per_family")} />
          <Choice selected={mode === "organiser"} title="I pay for everyone" onClick={() => setMode("organiser")} />
        </div>
      </fieldset>
      <CheckInField label="Payment deadline" checkIn={payDay} minDate={today} onCheckIn={setPayDay} hint="At least 72 hours before check-in noon IST." />
      <div>
        <p className="text-sm font-medium">Hour</p>
        <div className="mt-2 flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" aria-label="Earlier hour" disabled={payHour <= 0} onClick={() => setPayHour((hour) => Math.max(0, hour - 1))}>−</Button>
          <span className="min-w-10 text-center font-display text-2xl tabular-nums"><DigitPop value={payHour} /></span>
          <Button type="button" variant="outline" size="icon" aria-label="Later hour" disabled={payHour >= 23} onClick={() => setPayHour((hour) => Math.min(23, hour + 1))}>+</Button>
        </div>
      </div>
      <Button type="submit">Send shares</Button>
    </form>
  );
}

