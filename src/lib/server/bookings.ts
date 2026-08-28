import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { cardBrand, cvcValid, expiryValid, luhnValid, digitsOnly } from "@/lib/card";
import { getPackage, priceWithSwaps } from "@/lib/packages";

export type BookingRow = {
  id: number;
  packageId: string;
  packageName: string;
  nights: number;
  travelers: number;
  checkIn: string;
  amountInr: number;
  swaps: Record<string, string>;
  status: string;
  cardLast4: string | null;
  cardBrand: string | null;
  payerName: string;
  confirmationCode: string;
  createdAt: string;
};

type DbBooking = {
  id: number;
  package_id: string;
  package_name: string;
  nights: number;
  travelers: number;
  check_in: string;
  amount_inr: number;
  swaps: string;
  status: string;
  card_last4: string | null;
  card_brand: string | null;
  payer_name: string;
  confirmation_code: string;
  created_at: string;
};

function mapBooking(row: DbBooking): BookingRow {
  let swaps: Record<string, string> = {};
  try {
    const parsed = JSON.parse(row.swaps) as unknown;
    if (parsed && typeof parsed === "object") {
      swaps = parsed as Record<string, string>;
    }
  } catch {
    swaps = {};
  }
  return {
    id: row.id,
    packageId: row.package_id,
    packageName: row.package_name,
    nights: row.nights,
    travelers: row.travelers,
    checkIn: row.check_in,
    amountInr: row.amount_inr,
    swaps,
    status: row.status,
    cardLast4: row.card_last4,
    cardBrand: row.card_brand,
    payerName: row.payer_name,
    confirmationCode: row.confirmation_code,
    createdAt: row.created_at,
  };
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "TW-";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const listBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<DbBooking>`
      select id, package_id, package_name, nights, travelers, check_in, amount_inr,
             swaps, status, card_last4, card_brand, payer_name, confirmation_code, created_at
      from bookings
      where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map(mapBooking);
  });

const createInput = z.object({
  packageId: z.string().min(1),
  swaps: z.record(z.string(), z.string()),
  travelers: z.number().int().min(1).max(8),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payerName: z.string().trim().min(2).max(80),
  cardNumber: z.string(),
  expiry: z.string(),
  cvc: z.string(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => createInput.parse(input))
  .handler(async ({ context, data }) => {
    const pkg = getPackage(data.packageId);
    if (!pkg) throw new Error("Stay not found");

    const checkIn = new Date(`${data.checkIn}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(checkIn.getTime()) || checkIn < today) {
      throw new Error("Check-in must be today or later");
    }

    const number = digitsOnly(data.cardNumber);
    if (!luhnValid(number)) throw new Error("Card number is not valid");
    const brand = cardBrand(number);
    if (!expiryValid(data.expiry)) throw new Error("Card expiry is not valid");
    if (!cvcValid(data.cvc, brand)) throw new Error("Security code is not valid");

    const amount = priceWithSwaps(pkg, data.swaps) * data.travelers;
    const last4 = number.slice(-4);
    const sql = await getSql();
    const swapsJson = JSON.stringify(data.swaps ?? {});
    const code = makeCode();

    const rows = await sql<DbBooking>`
      insert into bookings (
        user_id, package_id, package_name, nights, travelers, check_in,
        amount_inr, swaps, status, card_last4, card_brand, payer_name, confirmation_code
      ) values (
        ${context.userId}, ${pkg.id}, ${pkg.name}, ${pkg.nights}, ${data.travelers},
        ${data.checkIn}::date, ${amount}, ${swapsJson}, 'paid',
        ${last4}, ${brand}, ${data.payerName}, ${code}
      )
      returning id, package_id, package_name, nights, travelers, check_in, amount_inr,
                swaps, status, card_last4, card_brand, payer_name, confirmation_code, created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("Could not save booking");
    return mapBooking(row);
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update bookings
      set status = 'cancelled'
      where id = ${id} and user_id = ${context.userId} and status = 'paid'
    `;
    return { ok: true };
  });
