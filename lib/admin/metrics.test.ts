import { describe, expect, it } from "vitest";

import {
  barWidth,
  bucketScansByHour,
  formatHour,
  peakHour,
  topN,
} from "./metrics";

describe("bucketScansByHour", () => {
  it("returns 24 buckets even with no scans", () => {
    const buckets = bucketScansByHour([]);

    expect(buckets).toHaveLength(24);
    expect(buckets.every((bucket) => bucket.count === 0)).toBe(true);
  });

  it("counts scans using the Costa Rica hour", () => {
    const buckets = bucketScansByHour([
      new Date("2026-05-10T13:05:00.000Z"),
      new Date("2026-05-10T13:45:00.000Z"),
      new Date("2026-05-10T09:10:00.000Z"),
    ]);

    expect(buckets[7]?.count).toBe(2);
    expect(buckets[3]?.count).toBe(1);
    expect(buckets.reduce((total, bucket) => total + bucket.count, 0)).toBe(3);
  });
});

describe("peakHour", () => {
  it("returns null when every bucket is empty", () => {
    expect(peakHour(bucketScansByHour([]))).toBeNull();
  });

  it("returns the busiest hour", () => {
    const buckets = bucketScansByHour([
      new Date("2026-05-10T11:00:00.000Z"),
      new Date("2026-05-10T11:30:00.000Z"),
      new Date("2026-05-10T16:00:00.000Z"),
    ]);

    expect(peakHour(buckets)).toEqual({ hour: 5, count: 2 });
  });

  it("keeps the earliest hour when counts tie", () => {
    const buckets = bucketScansByHour([
      new Date("2026-05-10T08:00:00.000Z"),
      new Date("2026-05-10T15:00:00.000Z"),
    ]);

    expect(peakHour(buckets)?.hour).toBe(2);
  });
});

describe("formatHour", () => {
  it("pads single digits", () => {
    expect(formatHour(0)).toBe("00:00");
    expect(formatHour(9)).toBe("09:00");
    expect(formatHour(23)).toBe("23:00");
  });
});

describe("barWidth", () => {
  it("returns 0 when there is nothing to scale against", () => {
    expect(barWidth(0, 0)).toBe(0);
    expect(barWidth(5, 0)).toBe(0);
  });

  it("rounds the percentage of the max", () => {
    expect(barWidth(5, 10)).toBe(50);
    expect(barWidth(1, 3)).toBe(33);
    expect(barWidth(10, 10)).toBe(100);
  });
});

describe("topN", () => {
  const rows = [
    { name: "a", scans: 3 },
    { name: "b", scans: 10 },
    { name: "c", scans: 7 },
  ];

  it("sorts by score descending and caps the list", () => {
    expect(topN(rows, 2, (row) => row.scans).map((row) => row.name)).toEqual([
      "b",
      "c",
    ]);
  });

  it("does not mutate the input array", () => {
    const copy = [...rows];

    topN(rows, 2, (row) => row.scans);

    expect(rows).toEqual(copy);
  });

  it("handles a zero or negative limit", () => {
    expect(topN(rows, 0, (row) => row.scans)).toEqual([]);
    expect(topN(rows, -5, (row) => row.scans)).toEqual([]);
  });
});
