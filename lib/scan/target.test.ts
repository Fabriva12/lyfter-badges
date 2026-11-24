import { describe, expect, it } from "vitest";

import { resolveScanTarget, type ScanQr } from "./target";

const NOW = new Date("2026-11-06T12:00:00.000Z");

function qr(overrides: Partial<ScanQr> = {}): ScanQr {
  return {
    token: "demo-keynote",
    kind: "BADGE",
    active: true,
    startsAt: null,
    expiresAt: null,
    badgeStartsAt: null,
    hasBadge: true,
    eventName: "Lyfter Demo Costa Rica 2026",
    ...overrides,
  };
}

describe("resolveScanTarget", () => {
  it("rejects a missing QR", () => {
    expect(resolveScanTarget(null, true, NOW)).toEqual({ status: "invalid" });
  });

  it("rejects an inactive QR", () => {
    expect(resolveScanTarget(qr({ active: false }), true, NOW)).toEqual({
      status: "invalid",
    });
  });

  it("accepts an active welcome QR", () => {
    expect(
      resolveScanTarget(qr({ kind: "WELCOME", hasBadge: false }), false, NOW),
    ).toEqual({
      status: "welcome",
      token: "demo-keynote",
      eventName: "Lyfter Demo Costa Rica 2026",
    });
  });

  it("ignores the schedule of a welcome QR, matching the claim flow", () => {
    expect(
      resolveScanTarget(
        qr({
          kind: "WELCOME",
          hasBadge: false,
          startsAt: new Date("2026-11-07T12:00:00.000Z"),
          expiresAt: new Date("2026-11-01T12:00:00.000Z"),
        }),
        false,
        NOW,
      ),
    ).toEqual({
      status: "welcome",
      token: "demo-keynote",
      eventName: "Lyfter Demo Costa Rica 2026",
    });
  });

  it("rejects a badge QR without a configured badge", () => {
    expect(resolveScanTarget(qr({ hasBadge: false }), true, NOW)).toEqual({
      status: "invalid",
    });
  });

  it("reports a QR that is not available yet", () => {
    expect(
      resolveScanTarget(
        qr({ startsAt: new Date("2026-11-07T12:00:00.000Z") }),
        true,
        NOW,
      ),
    ).toEqual({ status: "not_started" });
  });

  it("reports a badge that is scheduled for later", () => {
    expect(
      resolveScanTarget(
        qr({ badgeStartsAt: new Date("2026-11-07T12:00:00.000Z") }),
        true,
        NOW,
      ),
    ).toEqual({ status: "not_started" });
  });

  it("reports an expired QR", () => {
    expect(
      resolveScanTarget(
        qr({ expiresAt: new Date("2026-11-01T12:00:00.000Z") }),
        true,
        NOW,
      ),
    ).toEqual({ status: "expired" });
  });

  it("blocks a badge QR until the attendee checks in", () => {
    expect(resolveScanTarget(qr(), false, NOW)).toEqual({
      status: "needs_check_in",
      token: "demo-keynote",
      eventName: "Lyfter Demo Costa Rica 2026",
    });
  });

  it("allows a badge QR after the attendee checks in", () => {
    expect(resolveScanTarget(qr(), true, NOW)).toEqual({
      status: "ready",
      token: "demo-keynote",
      eventName: "Lyfter Demo Costa Rica 2026",
    });
  });

  it("treats the exact start time as available", () => {
    expect(
      resolveScanTarget(
        qr({ startsAt: new Date("2026-11-06T12:00:00.000Z") }),
        true,
        NOW,
      ),
    ).toEqual({
      status: "ready",
      token: "demo-keynote",
      eventName: "Lyfter Demo Costa Rica 2026",
    });
  });

  it("treats the exact expiration time as available", () => {
    expect(
      resolveScanTarget(
        qr({ expiresAt: new Date("2026-11-06T12:00:00.000Z") }),
        true,
        NOW,
      ),
    ).toEqual({
      status: "ready",
      token: "demo-keynote",
      eventName: "Lyfter Demo Costa Rica 2026",
    });
  });
});
