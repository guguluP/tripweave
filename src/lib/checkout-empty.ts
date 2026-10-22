export type CheckoutEmpty =
  | { kind: "form" }
  | { kind: "redirect"; code: string }
  | { kind: "empty" };

/** What /checkout should do before rendering the pay form. */
export function checkoutEmptyState(input: { pending: boolean; lastBooking: string | null | undefined }): CheckoutEmpty {
  if (input.pending) return { kind: "form" };
  const code = input.lastBooking?.trim();
  if (code) return { kind: "redirect", code };
  return { kind: "empty" };
}
