import { describe, expect, it } from "vitest";

import {
  buildRotationWindow,
  needsRotation,
  ROTATION_REFRESH_LEAD_MS,
  ROTATION_TTL_MS,
} from "./rotation";

const NOW = new Date("2026-11-23T12:00:00.000Z");

describe("buildRotationWindow", () => {
  it("builds an exact 90 second window that starts at now", () => {
    expect(buildRotationWindow(NOW)).toEqual({
      startsAt: NOW,
      expiresAt: new Date(NOW.getTime() + 90_000),
    });
    expect(ROTATION_TTL_MS).toBe(90_000);
  });
});

describe("needsRotation", () => {
  it("rotates a token without an expiry", () => {
    expect(needsRotation(null, NOW)).toBe(true);
  });

  it("rotates an already expired token", () => {
    expect(needsRotation(new Date(NOW.getTime() - 1), NOW)).toBe(true);
    expect(needsRotation(NOW, NOW)).toBe(true);
  });

  it("rotates a token inside the 30 second lead window, including its boundary", () => {
    expect(
      needsRotation(new Date(NOW.getTime() + ROTATION_REFRESH_LEAD_MS), NOW),
    ).toBe(true);
    expect(
      needsRotation(new Date(NOW.getTime() + ROTATION_REFRESH_LEAD_MS - 1), NOW),
    ).toBe(true);
  });

  it("keeps a fresh token outside the lead window", () => {
    expect(
      needsRotation(new Date(NOW.getTime() + ROTATION_REFRESH_LEAD_MS + 1), NOW),
    ).toBe(false);
    expect(needsRotation(new Date(NOW.getTime() + ROTATION_TTL_MS), NOW)).toBe(
      false,
    );
  });

  it("forces rotation of a fresh token without changing the default rule", () => {
    const freshExpiry = new Date(NOW.getTime() + ROTATION_TTL_MS);

    expect(needsRotation(freshExpiry, NOW, true)).toBe(true);
    expect(needsRotation(freshExpiry, NOW)).toBe(false);
  });
});
