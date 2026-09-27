import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransition,
  consumesInventory,
  deskConfirmTimeoutMinutes,
  isAwaitingDesk,
  isDeskConfirmed,
  nextStatus,
} from "./booking-status.ts";

describe("booking status machine", () => {
  it("moves held → paid → desk_confirmed → checked_in", () => {
    assert.equal(nextStatus("held", "mark_paid"), "paid");
    assert.equal(nextStatus("paid", "desk_confirm"), "desk_confirmed");
    assert.equal(nextStatus("desk_confirmed", "check_in"), "checked_in");
    assert.equal(nextStatus("confirmed", "check_in"), "checked_in");
  });

  it("rejects desk confirm unless paid", () => {
    assert.equal(canTransition("held", "desk_confirm"), false);
    assert.equal(canTransition("desk_confirmed", "desk_confirm"), false);
    assert.equal(nextStatus("held", "desk_confirm"), null);
  });

  it("treats legacy confirmed as desk confirmed for guests", () => {
    assert.equal(isDeskConfirmed("confirmed"), true);
    assert.equal(isDeskConfirmed("desk_confirmed"), true);
    assert.equal(isAwaitingDesk("paid"), true);
    assert.equal(isAwaitingDesk("desk_confirmed"), false);
  });

  it("counts confirmed statuses against inventory", () => {
    for (const status of ["held", "paid", "confirmed", "desk_confirmed", "checked_in"]) {
      assert.equal(consumesInventory(status), true, status);
    }
    assert.equal(consumesInventory("cancelled"), false);
    assert.equal(consumesInventory("refunded"), false);
  });

  it("clamps desk confirm timeout to 15–30 minutes", () => {
    const prev = process.env.TW_DESK_CONFIRM_MINUTES;
    process.env.TW_DESK_CONFIRM_MINUTES = "5";
    assert.equal(deskConfirmTimeoutMinutes(), 15);
    process.env.TW_DESK_CONFIRM_MINUTES = "90";
    assert.equal(deskConfirmTimeoutMinutes(), 30);
    process.env.TW_DESK_CONFIRM_MINUTES = "20";
    assert.equal(deskConfirmTimeoutMinutes(), 20);
    if (prev === undefined) delete process.env.TW_DESK_CONFIRM_MINUTES;
    else process.env.TW_DESK_CONFIRM_MINUTES = prev;
  });
});
