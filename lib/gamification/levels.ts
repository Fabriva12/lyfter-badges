// Pure level progression logic. No Prisma import: this module must stay
// testable with plain data and survive a Prisma API change.

export interface LevelThreshold {
  level: number;
  name: string;
  minXp: number;
}

export interface LevelProgress {
  /** The level reached for the given XP total. */
  level: number;
  name: string;
  /** XP accumulated so far. */
  xp: number;
  /** Minimum XP required to hold the current level. */
  minXp: number;
  /** XP needed to reach the next level, or null at the top level. */
  nextLevelXp: number | null;
  /** XP earned since the current level started. */
  xpIntoLevel: number;
  /** Total XP span of the current level, or null at the top level. */
  xpForLevel: number | null;
  /** XP still missing to reach the next level, or null at the top level. */
  xpToNextLevel: number | null;
  /** Progress within the current level, from 0 to 1 inclusive. */
  progress: number;
}

/**
 * Resolve the level reached for a cumulative XP total.
 *
 * Levels are cumulative across every event: the caller sums
 * `Scan.xpAwarded` and passes the total here.
 *
 * The thresholds do not need to arrive sorted; they are normalized here.
 * A negative XP total is treated as zero, and an empty threshold list
 * throws because there is no sensible level to report.
 */
export function levelForXp(
  xp: number,
  thresholds: LevelThreshold[],
): LevelProgress {
  if (thresholds.length === 0) {
    throw new Error("levelForXp requires at least one level threshold");
  }

  const sorted = [...thresholds].sort((a, b) => a.minXp - b.minXp);
  const safeXp = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;

  let current = sorted[0];
  let next: LevelThreshold | null = null;

  for (const threshold of sorted) {
    if (safeXp >= threshold.minXp) {
      current = threshold;
    } else {
      next = threshold;
      break;
    }
  }

  const xpIntoLevel = safeXp - current.minXp;

  if (next === null) {
    return {
      level: current.level,
      name: current.name,
      xp: safeXp,
      minXp: current.minXp,
      nextLevelXp: null,
      xpIntoLevel,
      xpForLevel: null,
      xpToNextLevel: null,
      progress: 1,
    };
  }

  const xpForLevel = next.minXp - current.minXp;
  const xpToNextLevel = next.minXp - safeXp;

  return {
    level: current.level,
    name: current.name,
    xp: safeXp,
    minXp: current.minXp,
    nextLevelXp: next.minXp,
    xpIntoLevel,
    xpForLevel,
    xpToNextLevel,
    progress: xpForLevel > 0 ? xpIntoLevel / xpForLevel : 1,
  };
}
