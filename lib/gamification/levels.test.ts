import { describe, expect, it } from "vitest";

import {
  levelForXp,
  type LevelThreshold,
} from "./levels";

const thresholds: LevelThreshold[] = [
  { level: 1, name: "Newcomer", minXp: 0 },
  { level: 2, name: "Regular", minXp: 100 },
  { level: 3, name: "Insider", minXp: 250 },
  { level: 4, name: "Connector", minXp: 450 },
  { level: 5, name: "Ambassador", minXp: 700 },
  { level: 6, name: "Legend", minXp: 1000 },
];

describe("levelForXp", () => {
  it("reports level 1 at exactly zero XP", () => {
    const result = levelForXp(0, thresholds);

    expect(result.level).toBe(1);
    expect(result.name).toBe("Newcomer");
    expect(result.xpIntoLevel).toBe(0);
    expect(result.xpToNextLevel).toBe(100);
    expect(result.progress).toBe(0);
  });

  it("stays on the lower level just below the threshold", () => {
    const result = levelForXp(99, thresholds);

    expect(result.level).toBe(1);
    expect(result.xpToNextLevel).toBe(1);
  });

  it("promotes exactly at the threshold", () => {
    const result = levelForXp(100, thresholds);

    expect(result.level).toBe(2);
    expect(result.name).toBe("Regular");
    expect(result.xpIntoLevel).toBe(0);
    expect(result.xpForLevel).toBe(150);
    expect(result.xpToNextLevel).toBe(150);
  });

  it("computes progress within a level", () => {
    const result = levelForXp(175, thresholds);

    expect(result.level).toBe(2);
    expect(result.xpIntoLevel).toBe(75);
    expect(result.xpForLevel).toBe(150);
    expect(result.progress).toBeCloseTo(0.5);
  });

  it("caps at the top level with no next level", () => {
    const result = levelForXp(5000, thresholds);

    expect(result.level).toBe(6);
    expect(result.name).toBe("Legend");
    expect(result.nextLevelXp).toBeNull();
    expect(result.xpToNextLevel).toBeNull();
    expect(result.xpForLevel).toBeNull();
    expect(result.progress).toBe(1);
  });

  it("treats a negative XP total as zero", () => {
    const result = levelForXp(-50, thresholds);

    expect(result.xp).toBe(0);
    expect(result.level).toBe(1);
  });

  it("floors a fractional XP total", () => {
    const result = levelForXp(120.9, thresholds);

    expect(result.xp).toBe(120);
    expect(result.level).toBe(2);
  });

  it("normalizes unsorted thresholds", () => {
    const shuffled: LevelThreshold[] = [
      { level: 3, name: "Insider", minXp: 250 },
      { level: 1, name: "Newcomer", minXp: 0 },
      { level: 2, name: "Regular", minXp: 100 },
    ];

    expect(levelForXp(120, shuffled).level).toBe(2);
  });

  it("throws when thresholds are empty", () => {
    expect(() => levelForXp(10, [])).toThrow();
  });
});
