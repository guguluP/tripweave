import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop } from "@/components/motion";
import { formatCheckInLabel } from "@/components/stay-quote";
import { stayStatusLabel } from "@/lib/refund-policy";
import { cn } from "@/lib/utils";

/** Shared shape for desk and partner-desk booking rows. */
export type DeskBookingView = {
  id: number;
  payerName: string;
  confirmationCode: string;
  checkIn: string;
  nights: number;
  travelers: number;
  amountInr: number;
  status: string;
  opsFlaggedAt?: string | null;
};

export function formatDeskDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const label = formatCheckInLabel(iso);
  return Number.isNaN(new Date(`${iso}T12:00:00+05:30`).getTime()) ? iso : label;
}

export const deskSelectClass =
  "w-full min-h-11 rounded-md border border-border bg-elevated px-3 text-sm text-fg shadow-none outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50";

export function DeskSelect({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(deskSelectClass, className)} {...props} />;
}

export function deskStatusTone(status: string) {
  if (status === "paid") return "awaiting";
  if (status === "desk_confirmed" || status === "confirmed") return "ok";
  if (status === "checked_in" || status === "completed") return "ok";
  if (
    status === "cancelled" ||
    status === "refunded" ||
    status === "refund_pending" ||
    status === "failed"
  ) {
    return "danger";
  }
  if (status === "held") return "muted";
  return "muted";
}

const TONE_CLASS: Record<string, string> = {
  awaiting: "border-[#c4852a]/30 bg-[#c4852a]/10 text-[#7a4e10]",
  ok: "border-ok/25 bg-ok/10 text-ok",
  danger: "border-danger/25 bg-danger/10 text-danger",
  muted: "border-border bg-surface text-muted",
  primary: "border-primary/25 bg-primary/10 text-primary",
};

export function deskStatusLabel(status: string) {
  if (status === "paid") return "Awaiting";
  if (status === "desk_confirmed" || status === "confirmed") return "Confirmed";
  if (status === "checked_in") return "Checked in";
  return stayStatusLabel(status);
}

export function DeskStatusBadge({
  status,
  className,
  children,
  tone,
}: {
  status?: string;
  className?: string;
  children?: ReactNode;
  tone?: keyof typeof TONE_CLASS;
}) {
  const resolved = tone ?? (status ? deskStatusTone(status) : "muted");
  return (
    <Badge
      className={cn("border font-medium", TONE_CLASS[resolved] ?? TONE_CLASS.muted, className)}
    >
      {children ?? (status ? deskStatusLabel(status) : null)}
    </Badge>
  );
}

export function DeskStatCard({
  label,
  value,
  hint,
  emphasize = false,
  loading = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  emphasize?: boolean;
  loading?: boolean;
}) {
  return (
    <Card
      className={cn("p-4 shadow-none", emphasize && "border-primary/40 ring-1 ring-primary/15")}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-9 w-16" />
      ) : (
        <p className="mt-1 font-display text-3xl tabular-nums leading-none tracking-tight">
          <DigitPop value={value} />
        </p>
      )}
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

export function DeskSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      {(eyebrow || title || description || actions) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? (
              <h2 className={cn("font-display text-2xl", eyebrow && "mt-1")}>{title}</h2>
            ) : null}
            {description ? <div className="mt-1 text-sm text-muted">{description}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function DeskEmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-elevated px-6 py-10 text-center">
      <p className="font-display text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {children}
    </div>
  );
}

export function DeskErrorState({
  title = "Could not load this list",
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-danger/25 bg-danger/5 px-6 py-8 text-center"
      role="alert"
    >
      <p className="font-display text-xl text-danger">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {onRetry ? (
        <Button className="mt-4" type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function DeskBookingsSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading stays">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function DeskPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="Opening desk">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-10 w-72" />
      <Skeleton className="mt-2 h-4 w-full max-w-lg" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="mt-8 h-48 rounded-xl" />
    </div>
  );
}

export function DeskGate({
  eyebrow = "Hotel desk",
  title,
  body,
  children,
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  children?: ReactNode;
  tone?: "default" | "danger" | "ok";
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-14rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full p-6 shadow-none sm:p-8">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1
          className={cn(
            "mt-2 font-display text-3xl",
            tone === "danger" && "text-danger",
            tone === "ok" && "text-ok",
          )}
        >
          {title}
        </h1>
        {body ? <div className="mt-3 text-sm text-muted">{body}</div> : null}
        {children}
      </Card>
    </div>
  );
}

export function DeskBookingCard({
  booking,
  foreign = false,
  flagged = false,
  children,
}: {
  booking: DeskBookingView;
  foreign?: boolean;
  flagged?: boolean;
  children?: ReactNode;
}) {
  return (
    <li className="rounded-xl border border-border bg-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{booking.payerName}</p>
          <p className="mt-0.5 font-mono text-xs tabular-nums tracking-wide text-muted">
            {booking.confirmationCode}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {foreign ? <DeskStatusBadge tone="muted">Foreign guests</DeskStatusBadge> : null}
          {flagged ? <DeskStatusBadge tone="danger">Overdue</DeskStatusBadge> : null}
          <DeskStatusBadge status={booking.status} />
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Check-in</dt>
          <dd className="font-medium">{formatDeskDate(booking.checkIn)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Stay</dt>
          <dd className="font-medium">
            {booking.nights === 1 ? "1 night" : `${booking.nights} nights`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Guests</dt>
          <dd className="font-medium">
            {booking.travelers === 1 ? "1 guest" : `${booking.travelers} guests`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Paid</dt>
          <dd className="font-medium tabular-nums">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(booking.amountInr)}
          </dd>
        </div>
      </dl>
      {children}
    </li>
  );
}

export function DeskBookingsTable({
  bookings,
  foreignCodes,
  actions,
}: {
  bookings: DeskBookingView[];
  foreignCodes: Set<string>;
  actions: (booking: DeskBookingView) => ReactNode;
}) {
  const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-elevated">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted">
            <th className="px-4 py-3 font-medium">Guest</th>
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Check-in</th>
            <th className="px-4 py-3 font-medium">Stay</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        {bookings.map((booking) => {
          const foreign = foreignCodes.has(booking.confirmationCode);
          const flagged = Boolean(booking.opsFlaggedAt);
          const action = actions(booking);
          return (
            <tbody key={booking.id} className="border-b border-border last:border-0">
              <tr>
                <td className="px-4 pt-3 pb-2">
                  <p className="font-medium">{booking.payerName}</p>
                  {foreign ? (
                    <p className="mt-1">
                      <DeskStatusBadge tone="muted">Foreign guests</DeskStatusBadge>
                    </p>
                  ) : null}
                </td>
                <td className="px-4 pt-3 pb-2 font-mono text-xs tabular-nums tracking-wide text-muted">
                  {booking.confirmationCode}
                </td>
                <td className="px-4 pt-3 pb-2 whitespace-nowrap">
                  {formatDeskDate(booking.checkIn)}
                </td>
                <td className="px-4 pt-3 pb-2 whitespace-nowrap text-muted">
                  {booking.nights === 1 ? "1 night" : `${booking.nights} nights`}
                  {" · "}
                  {booking.travelers === 1 ? "1 guest" : `${booking.travelers} guests`}
                </td>
                <td className="px-4 pt-3 pb-2 font-medium tabular-nums whitespace-nowrap">
                  {money(booking.amountInr)}
                </td>
                <td className="px-4 pt-3 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    <DeskStatusBadge status={booking.status} />
                    {flagged ? <DeskStatusBadge tone="danger">Overdue</DeskStatusBadge> : null}
                  </div>
                </td>
              </tr>
              {action ? (
                <tr>
                  <td colSpan={6} className="px-4 pb-4 pt-1">
                    {action}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="h-1 p-0" />
                </tr>
              )}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
