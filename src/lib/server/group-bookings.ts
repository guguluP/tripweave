import { writeMeta } from "@/lib/booking-meta";
import { getPackage } from "@/lib/packages";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { GroupDoc } from "@/lib/group/engine";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  let out = "TW-";
  for (let i = 0; i < 10; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/** One paid booking per room unit, in the organiser's name. */
export function planRoomBookings(doc: GroupDoc) {
  const pkg = doc.trip.lockedPackageId ? getPackage(doc.trip.lockedPackageId) : undefined;
  const units = doc.trip.lockedRooms.flatMap((room) => Array.from({ length: room.units }, () => room));
  if (!pkg || units.length === 0) return [];
  const base = Math.floor(doc.trip.requiredInr / units.length);
  let remainder = doc.trip.requiredInr - base * units.length;
  let party = doc.trip.adults + doc.trip.children;
  const codes = units.map((room) => room.roomId);
  return units.map((room, index) => {
    const occupancy = pkg.rooms.find((item) => item.id === room.roomId)?.occupancy ?? 2;
    const travelers = Math.max(1, Math.min(occupancy, party));
    party -= travelers;
    const amountInr = base + (index === 0 ? remainder : 0);
    if (index === 0) remainder = 0;
    return {
      roomId: room.roomId,
      confirmationCode: makeCode(),
      amountInr,
      travelers,
      status: "paid",
      siblingCodes: codes,
    };
  });
}

export async function insertGroupBookings(doc: GroupDoc) {
  if (doc.bookings.length > 0) return doc.bookings;
  const pkg = doc.trip.lockedPackageId ? getPackage(doc.trip.lockedPackageId) : undefined;
  const planned = planRoomBookings(doc);
  if (!pkg || planned.length === 0) return [];
  const codes = planned.map((row) => row.confirmationCode);
  const organiser = doc.members.find((member) => member.isOrganiser);
  const sb = getSupabaseAdmin();
  const stored = [];
  for (const row of planned) {
    const swaps = writeMeta(
      { roomId: row.roomId },
      { roomId: row.roomId, groupTripId: doc.trip.id, groupCodes: codes },
    );
    if (!sb) {
      stored.push({ roomId: row.roomId, confirmationCode: row.confirmationCode, amountInr: row.amountInr, travelers: row.travelers, status: "paid" });
      continue;
    }
    const rowBody = {
      user_id: doc.trip.organiserUserId,
      package_id: pkg.id,
      package_name: pkg.name,
      nights: doc.trip.nights,
      travelers: row.travelers,
      check_in: doc.trip.checkIn,
      amount_inr: row.amountInr,
      swaps,
      status: "paid",
      payer_name: organiser?.displayName || "Organiser",
      confirmation_code: row.confirmationCode,
      payment_method: "group",
      group_trip_id: doc.trip.id,
    };
    let { error } = await sb.from("bookings").insert(rowBody);
    if (error && /group_trip_id/i.test(error.message)) {
      const { group_trip_id: _drop, ...without } = rowBody;
      error = (await sb.from("bookings").insert(without)).error;
    }
    if (error) throw new Error(error.message);
    stored.push({ roomId: row.roomId, confirmationCode: row.confirmationCode, amountInr: row.amountInr, travelers: row.travelers, status: "paid" });
  }
  return stored;
}
