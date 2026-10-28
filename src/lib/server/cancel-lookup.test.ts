import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const bookings = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
const start = bookings.indexOf("export const cancelBooking = ");
const cancel = bookings.slice(start, bookings.indexOf("const target = rows.find", start));

test("cancelBooking finds a stay kept in the Postgres (DATABASE_URL) store", () => {
  // Before this, only memory and Supabase were read, so every SQL stay said "not open to cancel".
  assert.match(cancel, /else if \(!useMemoryStore\(\)\)/);
  assert.match(cancel, /from bookings\s+where user_id = \$\{context\.userId\} and id = \$\{id\}/);
});
