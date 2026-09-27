/**
 * Funnel analytics — provider-agnostic.
 * Default sink is console.debug. Swap via setAnalyticsSink (PostHog, GA, …).
 * No third-party SDK ships with the app.
 */

export type FunnelEvent =
  | "brief_completed"
  | "match_clicked"
  | "checkout_opened"
  | "paid"
  | "webhook_booked";

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsSink = (event: FunnelEvent, payload?: AnalyticsPayload) => void;

const g = globalThis as typeof globalThis & { __twAnalyticsSink__?: AnalyticsSink };

function defaultSink(event: FunnelEvent, payload?: AnalyticsPayload) {
  if (typeof console !== "undefined" && typeof console.debug === "function") {
    console.debug("[tw:funnel]", event, payload ?? {});
  }
}

export function setAnalyticsSink(sink: AnalyticsSink | null) {
  g.__twAnalyticsSink__ = sink ?? undefined;
}

export function track(event: FunnelEvent, payload?: AnalyticsPayload) {
  const sink = g.__twAnalyticsSink__ ?? defaultSink;
  try {
    sink(event, payload);
  } catch (err) {
    console.warn("[tw:funnel] sink failed", err instanceof Error ? err.message : err);
  }
}
