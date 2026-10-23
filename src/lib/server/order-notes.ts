/** Razorpay order notes written when the stay order was created. */
export function orderNotesMatchStay(
  notes: Record<string, string> | null | undefined,
  expect: {
    userId: string;
    packageId: string;
    roomId: string;
    checkIn: string;
    nights: number;
    travelers: number;
  },
): boolean {
  if (!notes?.userId || notes.userId !== expect.userId) return false;
  if (notes.packageId !== expect.packageId) return false;
  if ((notes.roomId ?? "") !== expect.roomId) return false;
  if (notes.checkIn !== expect.checkIn) return false;
  if (Number(notes.nights) !== expect.nights) return false;
  if (Number(notes.travelers) !== expect.travelers) return false;
  return true;
}
