import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { emailArrivalChecklist } from "@/lib/server/arrival-mail";
import { requestHotelCar } from "@/lib/server/ask-actions";
import { REDACTED_QUESTION, type AskSuggestion } from "@/lib/arrival-ask";
import { OFFICIAL_URLS, presentAnswer, type AskChip } from "@/lib/ask-present";
import { getBearerToken } from "@/lib/auth/client";
import { guestLabel, useGuestLocale, type GuestLocale } from "@/lib/guest-locale";
import { isActiveStayStatus, isCancellableStatus, refundAmountInr, refundPolicyFor } from "@/lib/refund-policy";
import { pickupQuoteFor } from "@/lib/travel-plan";
import { Button } from "@/components/ui/button";

type Turn = { question: string; answer: string; chips: AskChip[]; tripweave: boolean };
type Tap = { id: AskSuggestion; text: string };

/**
 * Ask TripWeave panel. Answers come from /api/ask, which uses only this stay's facts and the
 * arrival rules (no AI model). The client sends one question or one suggestion id, never the
 * earlier turns: the server loads the saved thread itself.
 */
export function AskTripWeave({
  nationalities = [],
  oci,
  priorIndianVisa,
  arrivalAirport,
  checkIn,
  packageId,
  roomId,
  nights,
  arriveBy,
  confirmationCode,
  includePickup = false,
  amountInr,
  status,
  onRequestCar,
  embedded = false,
}: {
  nationalities?: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
  packageId?: string;
  roomId?: string;
  nights?: number;
  arriveBy?: string;
  confirmationCode?: string;
  includePickup?: boolean;
  amountInr?: number;
  /** Booking status. Without one, a booked stay shows no refund line and no car button. */
  status?: string;
  /** Before a booking exists, the page turns the car on in the travel draft. */
  onRequestCar?: () => void;
  embedded?: boolean;
}) {
  const locale = useGuestLocale();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [carOn, setCarOn] = useState(includePickup);
  const [carNote, setCarNote] = useState("");
  const [mailNote, setMailNote] = useState("");
  const inflight = useRef<AbortController | null>(null);

  useEffect(() => {
    setCarOn(includePickup);
  }, [includePickup]);

  // Abort any open request when the panel closes.
  useEffect(() => () => inflight.current?.abort(), []);

  useEffect(() => {
    const code = confirmationCode?.trim();
    if (!code) return;
    const controller = new AbortController();
    const headers: Record<string, string> = {};
    const token = getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`/api/ask?confirmationCode=${encodeURIComponent(code)}`, {
      headers,
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { turns?: { question: string; answer: string }[] } | null) => {
        const saved = body?.turns ?? [];
        if (saved.length === 0 || controller.signal.aborted) return;
        setTurns(
          saved.map((row) => {
            const view = presentAnswer(row.answer, OFFICIAL_URLS);
            return { question: row.question, answer: view.prose || row.answer, chips: view.chips, tripweave: view.tripweave };
          }),
        );
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [confirmationCode]);

  const suggestions: Tap[] = [
    { id: "fly", text: guestLabel(locale, "askFly") },
    { id: "refund", text: guestLabel(locale, "askRefund") },
    { id: "car", text: guestLabel(locale, "askCar") },
    ...(confirmationCode ? [{ id: "desk" as const, text: guestLabel(locale, "askDesk") }] : []),
  ];

  const pushTurn = (asked: string, answer: string, chips: AskChip[], tripweave: boolean) => {
    setTurns((prev) => [...prev, { question: asked, answer, chips, tripweave }].slice(-8));
  };

  const ask = (tap?: Tap) => {
    const text = (tap?.text ?? question).trim();
    if (text.length < 3 || busy) return;
    setBusy(true);
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch("/api/ask", {
      method: "POST",
      credentials: "same-origin",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        ...(tap ? { suggestion: tap.id } : { question: text }),
        nationalities: nationalities.filter((code) => /^[A-Z]{2}$/.test(code)).slice(0, 12),
        oci: oci?.slice(0, 12),
        priorIndianVisa: priorIndianVisa?.slice(0, 12),
        arrivalAirport: arrivalAirport && /^[A-Z]{3}$/.test(arrivalAirport) ? arrivalAirport : undefined,
        checkIn: checkIn && /^\d{4}-\d{2}-\d{2}$/.test(checkIn) ? checkIn : undefined,
        packageId,
        roomId,
        nights,
        arriveBy: arriveBy === "fly" || arriveBy === "train" || arriveBy === "bus" || arriveBy === "road" ? arriveBy : undefined,
        confirmationCode,
        locale,
      }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | { ok: true; answer: string; chips?: AskChip[]; tripweave?: boolean }
          | { ok: false; reason?: string }
          | null;
        if (controller.signal.aborted) return;
        if (body && body.ok === true && typeof body.answer === "string" && body.answer) {
          pushTurn(text, body.answer, body.chips ?? [], Boolean(body.tripweave));
          return;
        }
        const reason = body && body.ok === false ? body.reason : undefined;
        // A question that looked like a passport number is not shown back either.
        pushTurn(reason === "no_documents" ? REDACTED_QUESTION : text, answerFor(locale, reason), [], false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        pushTurn(text, guestLabel(locale, "askFailed"), [], false);
      })
      .finally(() => {
        if (inflight.current === controller) inflight.current = null;
        if (controller.signal.aborted) return;
        setBusy(false);
        if (!tap) setQuestion("");
      });
  };

  const booked = Boolean(confirmationCode);
  const foreign = nationalities.some((code) => (code || "IN").toUpperCase() !== "IN");
  // A booked stay only offers the car while it is live (not cancelled, refunded or past).
  const carAllowed = booked ? isActiveStayStatus(status) : Boolean(onRequestCar);
  const carAvailable = carAllowed && arriveBy === "fly" && packageId ? pickupQuoteFor(packageId, "fly").available : false;
  const refundPending = booked && status === "refund_pending";
  // Before booking, the line is a quote. After booking, only statuses the cancel flow accepts get one.
  const quoteRefund = !booked || (isCancellableStatus(status) && !refundPending);
  const refund = !quoteRefund
    ? ""
    : checkIn && amountInr != null && amountInr > 0
      ? `₹${refundAmountInr(amountInr, checkIn).toLocaleString("en-IN")}. ${refundPolicyFor(checkIn).label}.`
      : checkIn
        ? refundPolicyFor(checkIn).label
        : "";

  const emailChecklist = () => {
    setMailNote("");
    void emailArrivalChecklist({
      data: {
        nationalities: nationalities.filter((code) => /^[A-Z]{2}$/.test(code)).slice(0, 12),
        oci,
        priorIndianVisa,
        confirmationCode,
        arrivalAirport,
      },
    })
      .then((result) => {
        setMailNote(result.ok ? guestLabel(locale, "askEmailSent") : guestLabel(locale, "askFailed"));
      })
      .catch(() => setMailNote(guestLabel(locale, "askFailed")));
  };

  const requestCar = () => {
    if (onRequestCar && !confirmationCode) {
      onRequestCar();
      setCarOn(true);
      setCarNote(guestLabel(locale, "askCarDone"));
      return;
    }
    if (!confirmationCode) return;
    void requestHotelCar({ data: { confirmationCode } })
      .then((result) => {
        if (result.ok) {
          setCarOn(true);
          setCarNote(guestLabel(locale, "askCarDone"));
        } else setCarNote(result.message);
      })
      .catch(() => setCarNote(guestLabel(locale, "askFailed")));
  };

  return (
    <div className={embedded ? "" : "mt-4 rounded-lg border border-border bg-elevated px-4 py-3"}>
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((tap) => (
          <button
            key={tap.id}
            type="button"
            className="rounded-md border border-border px-2 py-1 text-left text-xs"
            disabled={busy}
            onClick={() => ask(tap)}
          >
            {tap.text}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {turns.map((turn, index) => (
          <div key={`${index}-${turn.question}`} className="mt-3 text-sm">
            <p className="text-xs text-muted">{guestLabel(locale, "askYou")}</p>
            <p>{turn.question}</p>
            <p className="mt-1 whitespace-pre-line">{turn.answer}</p>
            {turn.tripweave ? <p className="mt-1 text-xs text-muted">{guestLabel(locale, "askFromStay")}</p> : null}
            {turn.chips.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {turn.chips.map((chip) => (
                  <a key={chip.url} className="ask-chip rounded-md border border-border px-2 py-1 text-xs underline" href={chip.url}>
                    {chip.title}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <label className="mt-3 block text-sm">
        <span className="sr-only">{guestLabel(locale, "askTitle")}</span>
        <textarea
          value={question}
          maxLength={400}
          rows={2}
          placeholder={guestLabel(locale, "askPlaceholder")}
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          onChange={(event) => setQuestion(event.target.value)}
        />
      </label>
      <Button type="button" variant="outline" className="mt-2" disabled={busy || question.trim().length < 3} onClick={() => ask()}>
        {busy ? guestLabel(locale, "askWorking") : guestLabel(locale, "askSend")}
      </Button>
      {turns.length > 0 ? (
        <div className="mt-4 grid gap-2 border-t border-border pt-3">
          {foreign ? (
            <Button type="button" variant="outline" onClick={emailChecklist}>
              {guestLabel(locale, "askEmail")}
            </Button>
          ) : null}
          {mailNote ? <p className="text-xs text-muted">{mailNote}</p> : null}
          {carAvailable && !carOn ? (
            <Button type="button" variant="outline" onClick={requestCar}>
              {guestLabel(locale, "askCarButton")}
            </Button>
          ) : null}
          {carNote ? <p className="text-xs text-muted">{carNote}</p> : null}
          {refundPending ? <p className="text-xs text-muted">{guestLabel(locale, "askRefundPending")}</p> : null}
          {refund ? <p className="text-xs text-muted">{guestLabel(locale, "askRefundNow")} {refund}</p> : null}
          {confirmationCode ? (
            <Link to="/voucher/$code" params={{ code: confirmationCode }} className="text-sm font-medium underline">
              {guestLabel(locale, "askOpenVoucher")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function answerFor(locale: GuestLocale, reason: string | undefined): string {
  if (reason === "rate_limited") return guestLabel(locale, "askLimited");
  if (reason === "no_documents") return guestLabel(locale, "askNoDocuments");
  return guestLabel(locale, "askFailed");
}
