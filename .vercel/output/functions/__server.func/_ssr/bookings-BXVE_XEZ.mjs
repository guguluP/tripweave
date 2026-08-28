import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { I as record, L as string, N as number, P as object } from "../_libs/@better-auth/core+[...].mjs";
import { d as priceWithSwaps, o as getPackage } from "./packages-eAQZmKLU.mjs";
import { r as getSql } from "./db-Chp8U7cw.mjs";
import { t as authMiddleware } from "./middleware-BcauzdWh.mjs";
import { a as expiryValid, i as digitsOnly, n as cardBrand, r as cvcValid, s as luhnValid } from "./card-mzLHUKsk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bookings-BXVE_XEZ.js
function mapBooking(row) {
	let swaps = {};
	try {
		const parsed = JSON.parse(row.swaps);
		if (parsed && typeof parsed === "object") swaps = parsed;
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
		createdAt: row.created_at
	};
}
function makeCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "TW-";
	for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * 32)];
	return out;
}
var listBookings_createServerFn_handler = createServerRpc({
	id: "a884b014a3ee092e4f0fe9bdf1808981d1d1cc6b0c69d0c40acadcf6acaf3bb6",
	name: "listBookings",
	filename: "src/lib/server/bookings.ts"
}, (opts) => listBookings.__executeServer(opts));
var listBookings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listBookings_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select id, package_id, package_name, nights, travelers, check_in, amount_inr,
             swaps, status, card_last4, card_brand, payer_name, confirmation_code, created_at
      from bookings
      where user_id = ${context.userId}
      order by created_at desc
    `).map(mapBooking);
});
var createInput = object({
	packageId: string().min(1),
	swaps: record(string(), string()),
	travelers: number().int().min(1).max(8),
	checkIn: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	payerName: string().trim().min(2).max(80),
	cardNumber: string(),
	expiry: string(),
	cvc: string()
});
var createBooking_createServerFn_handler = createServerRpc({
	id: "d2017fb40500149d6ef5a5d13ff9979d85dc47c87b63e8860c7777c112319b6e",
	name: "createBooking",
	filename: "src/lib/server/bookings.ts"
}, (opts) => createBooking.__executeServer(opts));
var createBooking = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => createInput.parse(input)).handler(createBooking_createServerFn_handler, async ({ context, data }) => {
	const pkg = getPackage(data.packageId);
	if (!pkg) throw new Error("Stay not found");
	const checkIn = /* @__PURE__ */ new Date(`${data.checkIn}T12:00:00`);
	const today = /* @__PURE__ */ new Date();
	today.setHours(0, 0, 0, 0);
	if (Number.isNaN(checkIn.getTime()) || checkIn < today) throw new Error("Check-in must be today or later");
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
	const row = (await sql`
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
    `)[0];
	if (!row) throw new Error("Could not save booking");
	return mapBooking(row);
});
var cancelBooking_createServerFn_handler = createServerRpc({
	id: "498fe86bbffb7f04dea2bf9fbe8305cc75b23455f34b910929983d511e4bf9aa",
	name: "cancelBooking",
	filename: "src/lib/server/bookings.ts"
}, (opts) => cancelBooking.__executeServer(opts));
var cancelBooking = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(cancelBooking_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`
      update bookings
      set status = 'cancelled'
      where id = ${id} and user_id = ${context.userId} and status = 'paid'
    `;
	return { ok: true };
});
//#endregion
export { cancelBooking_createServerFn_handler, createBooking_createServerFn_handler, listBookings_createServerFn_handler };
