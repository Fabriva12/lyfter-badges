import { describe, expect, it } from "vitest";

import {
  joinLocalDateTime,
  parseBadgeRarity,
  parseBadgeType,
  parseEventInput,
} from "./validation";

const VALID_DATES = {
  startsAt: "2026-05-10T09:00",
  endsAt: "2026-05-10T18:00",
};

describe("parseBadgeType", () => {
  it("defaults to TALK when the field is missing", () => {
    expect(parseBadgeType(undefined)).toEqual({ ok: true, value: "TALK" });
  });

  it("accepts every known type", () => {
    for (const type of ["WELCOME", "TALK", "STAND", "SPECIAL"] as const) {
      expect(parseBadgeType(type)).toEqual({ ok: true, value: type });
    }
  });

  it("rejects an unknown type", () => {
    const result = parseBadgeType("KEYNOTE");

    expect(result.ok).toBe(false);
  });
});

describe("parseBadgeRarity", () => {
  it("defaults to COMMON when the field is missing", () => {
    expect(parseBadgeRarity(undefined)).toEqual({ ok: true, value: "COMMON" });
  });

  it("accepts every known rarity", () => {
    for (const rarity of ["COMMON", "RARE", "LIMITED"] as const) {
      expect(parseBadgeRarity(rarity)).toEqual({ ok: true, value: rarity });
    }
  });

  it("rejects an unknown rarity", () => {
    const result = parseBadgeRarity("LEGENDARY");

    expect(result.ok).toBe(false);
  });
});

describe("joinLocalDateTime", () => {
  it("joins trimmed date and time parts into a datetime-local value", () => {
    expect(
      joinLocalDateTime("  2026-05-10  ", " 09:00 "),
    ).toBe("2026-05-10T09:00");
  });

  it("returns an empty string when either part is missing or empty", () => {
    expect(joinLocalDateTime("2026-05-10", undefined)).toBe("");
    expect(joinLocalDateTime(undefined, "09:00")).toBe("");
    expect(joinLocalDateTime("2026-05-10", "   ")).toBe("");
    expect(joinLocalDateTime(null, null)).toBe("");
  });
});

describe("parseEventInput", () => {
  it("defaults mode and status and trims empty optional fields", () => {
    const result = parseEventInput({
      name: "  Lyfter Summit  ",
      country: "   ",
      ...VALID_DATES,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.name).toBe("Lyfter Summit");
    expect(result.value.mode).toBe("IN_PERSON");
    expect(result.value.status).toBe("DRAFT");
    expect(result.value.country).toBeNull();
    expect(result.value.description).toBeNull();
  });

  it("keeps mode, status and country when they are valid", () => {
    const result = parseEventInput({
      name: "Remote Day",
      country: "Costa Rica",
      mode: "VIRTUAL",
      status: "ACTIVE",
      ...VALID_DATES,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.mode).toBe("VIRTUAL");
    expect(result.value.status).toBe("ACTIVE");
    expect(result.value.country).toBe("Costa Rica");
  });

  it("rejects an invalid mode", () => {
    const result = parseEventInput({
      name: "Remote Day",
      mode: "SPACE",
      ...VALID_DATES,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = parseEventInput({
      name: "Remote Day",
      status: "PAUSED",
      ...VALID_DATES,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects a country longer than 80 characters", () => {
    const result = parseEventInput({
      name: "Remote Day",
      country: "x".repeat(81),
      ...VALID_DATES,
    });

    expect(result.ok).toBe(false);
  });

  it("reads datetime-local values as Costa Rica wall time", () => {
    const result = parseEventInput({
      name: "Remote Day",
      ...VALID_DATES,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.startsAt.toISOString()).toBe(
      "2026-05-10T15:00:00.000Z",
    );
  });
});
