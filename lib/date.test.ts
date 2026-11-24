import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateTime,
  formatEventRange,
  hourInEventZone,
  parseLocalDateTime,
  toLocalDateValue,
  toLocalInputValue,
  toLocalTimeValue,
} from "./date";

describe("formatDateTime", () => {
  it("renders Costa Rica local time in Spanish with a 24-hour clock", () => {
    expect(formatDateTime(new Date("2026-11-05T16:35:00.000Z"))).toBe(
      "5 nov 2026, 10:35",
    );
  });
});

describe("formatDate", () => {
  it("renders only the date in Spanish", () => {
    expect(formatDate(new Date("2026-11-05T16:35:00.000Z"))).toBe(
      "5 nov 2026",
    );
  });
});

describe("formatEventRange", () => {
  it("shows both dates so an overnight event is unambiguous", () => {
    expect(
      formatEventRange(
        new Date("2026-11-05T16:35:00.000Z"),
        new Date("2026-11-06T07:00:00.000Z"),
      ),
    ).toBe("5 nov 2026, 10:35 – 6 nov 2026, 01:00");
  });
});

describe("parseLocalDateTime", () => {
  it("reads a datetime-local value as Costa Rica wall time", () => {
    expect(
      parseLocalDateTime("2026-05-10T09:00")?.toISOString(),
    ).toBe("2026-05-10T15:00:00.000Z");
  });

  it("round-trips through toLocalInputValue", () => {
    const date = parseLocalDateTime("2026-05-10T09:00");

    expect(date).not.toBeNull();
    expect(toLocalInputValue(date!)).toBe("2026-05-10T09:00");
  });

  it("rejects impossible dates and malformed values", () => {
    expect(parseLocalDateTime("2026-02-30T09:00")).toBeNull();
    expect(parseLocalDateTime("not a date")).toBeNull();
    expect(parseLocalDateTime(undefined)).toBeNull();
  });
});

describe("hourInEventZone", () => {
  it("returns the Costa Rica hour regardless of the machine timezone", () => {
    expect(hourInEventZone(new Date("2026-05-10T15:00:00.000Z"))).toBe(9);
  });
});

describe("toLocalDateValue", () => {
  it("returns the Costa Rica calendar date in date-input format", () => {
    expect(toLocalDateValue(new Date("2026-11-05T16:35:00.000Z"))).toBe(
      "2026-11-05",
    );
    expect(toLocalDateValue(new Date("2026-05-10T15:00:00.000Z"))).toBe(
      "2026-05-10",
    );
  });
});

describe("toLocalTimeValue", () => {
  it("returns the Costa Rica wall time in time-input format", () => {
    expect(toLocalTimeValue(new Date("2026-11-05T16:35:00.000Z"))).toBe(
      "10:35",
    );
    expect(toLocalTimeValue(new Date("2026-05-10T15:00:00.000Z"))).toBe(
      "09:00",
    );
  });

  it("splits toLocalInputValue without losing precision", () => {
    const date = new Date("2026-11-05T16:35:00.000Z");

    expect(
      `${toLocalDateValue(date)}T${toLocalTimeValue(date)}`,
    ).toBe(toLocalInputValue(date));
  });
});
