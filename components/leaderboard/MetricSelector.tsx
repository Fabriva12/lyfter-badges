import Link from "next/link";

import {
  LEADERBOARD_METRICS,
  LEADERBOARD_METRIC_LABELS,
  type LeaderboardMetric,
} from "@/lib/gamification/leaderboard";

import { leaderboardHref } from "./links";
import { METRIC_ACTIVE_PILL } from "./metrics";

interface MetricSelectorProps {
  activeMetric: LeaderboardMetric;
  eventSlug: string | null;
}

export default function MetricSelector({
  activeMetric,
  eventSlug,
}: MetricSelectorProps) {
  return (
    <nav
      aria-label="Métrica del ranking"
      className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:gap-3 sm:px-0"
    >
      <span className="shrink-0 pr-1 text-xs font-semibold uppercase tracking-widest text-muted">
        Métrica
      </span>

      {LEADERBOARD_METRICS.map((metric) => {
        const isActive = metric === activeMetric;

        return (
          <Link
            key={metric}
            href={leaderboardHref(eventSlug, metric)}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? METRIC_ACTIVE_PILL[metric]
                : "border-stroke bg-surface text-muted hover:bg-ink hover:text-subtle"
            }`}
          >
            {LEADERBOARD_METRIC_LABELS[metric]}
          </Link>
        );
      })}
    </nav>
  );
}
