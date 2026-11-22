// Pure leaderboard ranking logic. No Prisma import: this module must stay
// testable with plain data and survive a Prisma API change.

export const LEADERBOARD_METRICS = ["xp", "stands", "talks"] as const;

export type LeaderboardMetric = (typeof LEADERBOARD_METRICS)[number];

export const LEADERBOARD_METRIC_LABELS: Record<LeaderboardMetric, string> = {
  xp: "XP",
  stands: "Stands",
  talks: "Talks",
};

export function isLeaderboardMetric(
  value: unknown,
): value is LeaderboardMetric {
  return (
    typeof value === "string" &&
    (LEADERBOARD_METRICS as readonly string[]).includes(value)
  );
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  image: string | null;
  /** XP the attendee earned inside the scope. */
  xp: number;
  /** Badges the attendee collected inside the scope. */
  badges: number;
  /** Unique stand badges visited inside the scope. */
  stands: number;
  /** Unique talk badges attended inside the scope. */
  talks: number;
}

export interface RankedAttendee extends LeaderboardEntry {
  /** Competition rank: tied attendees share it and the next one skips. */
  rank: number;
  /** Sequential 1-based index in the sorted list. */
  position: number;
}

export interface LeaderboardRanking {
  /** Every attendee in the scope, already ranked. */
  rows: RankedAttendee[];
  /** The first three rows of the ranking. */
  top: RankedAttendee[];
}

/**
 * Clamp a counter to a usable value.
 *
 * Same defensive habit as `collectionProgress` in `collection.ts`: a
 * negative or non-finite counter is truncated to zero instead of leaking
 * into the ranking.
 */
function safeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Sort order for the leaderboard.
 *
 * The selected metric is the primary axis. XP and badges are the remaining
 * numeric tie-breakers, so a stand leader with the same visits but more XP
 * ranks higher. The display name is the last sorting axis and the user id the
 * final one, so the order stays deterministic even when two attendees share
 * the same name.
 */
function compareAttendees(
  a: LeaderboardEntry,
  b: LeaderboardEntry,
  metric: LeaderboardMetric,
): number {
  if (metric === "stands" || metric === "talks") {
    const other = metric === "stands" ? "talks" : "stands";

    if (a[metric] !== b[metric]) {
      return b[metric] - a[metric];
    }

    if (a[other] !== b[other]) {
      return b[other] - a[other];
    }
  }

  if (a.xp !== b.xp) {
    return b.xp - a.xp;
  }

  if (a.badges !== b.badges) {
    return b.badges - a.badges;
  }

  const byName = a.name.localeCompare(b.name);

  if (byName !== 0) {
    return byName;
  }

  // Codepoint order instead of `localeCompare`: user ids are opaque
  // strings and must not depend on the ICU locale of the server.
  if (a.userId === b.userId) {
    return 0;
  }

  return a.userId < b.userId ? -1 : 1;
}

/**
 * Whether two entries share the same rank for the selected metric.
 *
 * The fields checked here must match the numeric axes used by
 * `compareAttendees`, otherwise the displayed rank would disagree with the
 * sorted order.
 */
function sharesRank(
  a: LeaderboardEntry,
  b: LeaderboardEntry,
  metric: LeaderboardMetric,
): boolean {
  if (a.xp !== b.xp || a.badges !== b.badges) {
    return false;
  }

  if (metric === "xp") {
    return true;
  }

  return a.stands === b.stands && a.talks === b.talks;
}

/**
 * Rank the attendees of the selected scope and metric.
 *
 * `rank` is a standard competition rank: attendees with the same numeric
 * stats share it and the next rank skips (1, 1, 3). `position` is the
 * sequential index inside the sorted list, so it never skips. They are
 * different numbers on purpose: the rank answers "how many attendees are
 * ahead of me", the position answers "where am I in the list".
 *
 * An empty input returns an empty ranking instead of throwing.
 */
export function rankAttendees(
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric = "xp",
): LeaderboardRanking {
  if (entries.length === 0) {
    return { rows: [], top: [] };
  }

  const sorted = entries
    .map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      image: entry.image,
      xp: safeCount(entry.xp),
      badges: safeCount(entry.badges),
      stands: safeCount(entry.stands),
      talks: safeCount(entry.talks),
    }))
    .sort((a, b) => compareAttendees(a, b, metric));

  const rows: RankedAttendee[] = [];
  let rank = 0;
  let previous: LeaderboardEntry | null = null;

  sorted.forEach((entry, index) => {
    if (previous === null || !sharesRank(previous, entry, metric)) {
      rank = index + 1;
    }

    rows.push({ ...entry, rank, position: index + 1 });
    previous = entry;
  });

  return { rows, top: rows.slice(0, 3) };
}
