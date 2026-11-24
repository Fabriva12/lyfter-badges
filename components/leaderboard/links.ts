import type { LeaderboardMetric } from "@/lib/gamification/leaderboard";

export function leaderboardHref(
  eventSlug: string | null,
  metric: LeaderboardMetric,
): string {
  const params = new URLSearchParams();

  if (eventSlug) {
    params.set("event", eventSlug);
  }

  if (metric !== "xp") {
    params.set("metric", metric);
  }

  const query = params.toString();

  return query ? `/leaderboard?${query}` : "/leaderboard";
}
