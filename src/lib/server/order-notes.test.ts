import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderNotesMatchStay } from "./order-notes.ts";

const stay = {
  userId: "user-a",
  packageId: "taj-puri-resort-spa",
  roomId: "superior",
  checkIn: "2027-06-15",
  nights: 2,
  travelers: 2,
};

describe("order notes match the stay", () => {
  it("accepts the notes stored on the Razorpay order", () => {
    assert.equal(
      orderNotesMatchStay(
        {
          userId: stay.userId,
          packageId: stay.packageId,
          roomId: stay.roomId,
          checkIn: stay.checkIn,
          nights: "2",
          travelers: "2",
        },
        stay,
      ),
      true,
    );
  });

  it("rejects another guest or another stay", () => {
    const notes = {
      userId: "user-b",
      packageId: stay.packageId,
      roomId: stay.roomId,
      checkIn: stay.checkIn,
      nights: "2",
      travelers: "2",
    };
    assert.equal(orderNotesMatchStay(notes, stay), false);
    assert.equal(orderNotesMatchStay({ ...notes, userId: stay.userId, packageId: "other" }, stay), false);
    assert.equal(orderNotesMatchStay({ ...notes, userId: stay.userId, checkIn: "2027-06-16" }, stay), false);
    assert.equal(orderNotesMatchStay(undefined, stay), false);
  });
});
