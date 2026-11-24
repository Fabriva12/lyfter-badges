import type { LeaderboardMetric } from "@/lib/gamification/leaderboard";

export const METRIC_ACCENT: Record<LeaderboardMetric, string> = {
  xp: "text-sage",
  stands: "text-celeste",
  talks: "text-lilac",
};

export const METRIC_ACTIVE_PILL: Record<LeaderboardMetric, string> = {
  xp: "border-sage bg-sage/10 text-sage",
  stands: "border-celeste bg-celeste/10 text-celeste",
  talks: "border-lilac bg-lilac/10 text-lilac",
};

export const METRIC_NOUN: Record<LeaderboardMetric, string> = {
  xp: "XP",
  stands: "stands",
  talks: "charlas",
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

  const singular = metric === "stands" ? "stand" : "charla";

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
  const parts = [countLabel(entry.badges, "insignia", "insignias")];

  if (metric !== "stands") {
    parts.push(countLabel(entry.stands, "stand", "stands"));
  }

  if (metric !== "talks") {
    parts.push(countLabel(entry.talks, "charla", "charlas"));
  }

  if (metric !== "xp") {
    parts.push(`${entry.xp} XP`);
  }

  return parts.join(" · ");
}
