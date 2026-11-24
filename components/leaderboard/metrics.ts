import type { LeaderboardMetric } from "@/lib/gamification/leaderboard";

export const METRIC_ACCENT: Record<LeaderboardMetric, string> = {
  xp: "text-[#a8d889]",
  stands: "text-[#36bde9]",
  talks: "text-[#d77bdb]",
};

export const METRIC_ACTIVE_PILL: Record<LeaderboardMetric, string> = {
  xp: "border-[#a8d889] bg-[#a8d889]/10 text-[#a8d889]",
  stands: "border-[#36bde9] bg-[#36bde9]/10 text-[#36bde9]",
  talks: "border-[#d77bdb] bg-[#d77bdb]/10 text-[#d77bdb]",
};

export const METRIC_NOUN: Record<LeaderboardMetric, string> = {
  xp: "XP",
  stands: "stands",
  talks: "talks",
};

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** The unit under the big number in the podium and the mobile card. */
export function metricUnit(
  metric: LeaderboardMetric,
  value: number,
): string {
  if (metric === "xp") {
    return "XP";
  }

  const singular = metric === "stands" ? "stand" : "talk";

  return value === 1 ? singular : `${singular}s`;
}

/**
 * The stats that are not the selected metric, formatted for the secondary
 * line of the podium and the mobile card. The badge count always leads.
 */
export function secondaryStats(
  entry: { badges: number; stands: number; talks: number; xp: number },
  metric: LeaderboardMetric,
): string {
  const parts = [countLabel(entry.badges, "badge", "badges")];

  if (metric !== "stands") {
    parts.push(countLabel(entry.stands, "stand", "stands"));
  }

  if (metric !== "talks") {
    parts.push(countLabel(entry.talks, "talk", "talks"));
  }

  if (metric !== "xp") {
    parts.push(`${entry.xp} XP`);
  }

  return parts.join(" · ");
}
