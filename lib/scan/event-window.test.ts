import { describe, expect, it } from "vitest";

import { evaluateEventWindow, type EventWindow } from "./event-window";

const STARTS_AT = new Date("2026-11-06T12:00:00.000Z");
const ENDS_AT = new Date("2026-11-06T18:00:00.000Z");

function event(overrides: Partial<EventWindow> = {}): EventWindow {
  return { status: "ACTIVE", startsAt: STARTS_AT, endsAt: ENDS_AT, ...overrides };
}

describe("evaluateEventWindow", () => {
  it("allows an active event inside its schedule", () => {
    expect(
      evaluateEventWindow(event(), new Date("2026-11-06T15:00:00.000Z")),
    ).toEqual({ ok: true });
  });

  it("treats both boundaries as inclusive", () => {
    expect(evaluateEventWindow(event(), STARTS_AT)).toEqual({ ok: true });
    expect(evaluateEventWindow(event(), ENDS_AT)).toEqual({ ok: true });
  });

  it("rejects an active event before it starts", () => {
    expect(
      evaluateEventWindow(event(), new Date("2026-11-06T11:59:59.000Z")),
    ).toEqual({ ok: false, reason: "event_not_started" });
  });

  it("rejects an active event after it ends", () => {
    expect(
      evaluateEventWindow(event(), new Date("2026-11-06T18:00:01.000Z")),
    ).toEqual({ ok: false, reason: "event_ended" });
  });

  it("rejects a draft event even when its dates include now", () => {
    expect(
      evaluateEventWindow(event({ status: "DRAFT" }), new Date("2026-11-06T15:00:00.000Z")),
    ).toEqual({ ok: false, reason: "event_not_active" });
  });

  it("rejects a finished event even when its dates include now", () => {
    expect(
      evaluateEventWindow(
        event({ status: "FINISHED" }),
        new Date("2026-11-06T15:00:00.000Z"),
      ),
    ).toEqual({ ok: false, reason: "event_not_active" });
  });
});
