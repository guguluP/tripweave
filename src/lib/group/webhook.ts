/** Which Razorpay webhook events may mark a group share as paid. */

export type GroupWebhookPayment = {
  tripId: string;
  shareId: string;
  memberId: string;
  paymentId: string;
  amountInr: number;
  method: string;
};

type Entity = {
  id?: string;
  amount?: number;
  method?: string;
  status?: string;
  notes?: Record<string, string>;
};

export function isGroupShareNotes(notes: Record<string, string> | undefined | null): boolean {
  return notes?.kind === "group_share" && Boolean(notes.gt && notes.gs);
}

/**
 * Only a captured payment counts. payment.failed and payment.authorized carry the same
 * notes and a pay_ id, so the event name and the payment status are both checked.
 */
export function groupPaymentFromWebhook(eventName: string, payload: Record<string, unknown>): GroupWebhookPayment | null {
  const link = (payload.payment_link as { entity?: Entity } | undefined)?.entity;
  const payment = (payload.payment as { entity?: Entity } | undefined)?.entity;
  const orderNotes = (payload.order as { entity?: { notes?: Record<string, string> } } | undefined)?.entity?.notes;
  const notes = link?.notes ?? payment?.notes ?? orderNotes ?? {};
  if (!isGroupShareNotes(notes)) return null;
  if (eventName !== "payment_link.paid" && eventName !== "payment.captured") return null;
  if (payment?.status && payment.status !== "captured") return null;
  const paymentId = payment?.id ?? "";
  if (!paymentId.startsWith("pay_")) return null;
  return {
    tripId: notes.gt!,
    shareId: notes.gs!,
    memberId: notes.gm ?? "",
    paymentId,
    amountInr: Math.round((payment?.amount ?? 0) / 100),
    method: payment?.method ?? "upi",
  };
}
