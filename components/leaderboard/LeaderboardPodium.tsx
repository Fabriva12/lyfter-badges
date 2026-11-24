import type {
  LeaderboardMetric,
  RankedAttendee,
} from "@/lib/gamification/leaderboard";

import {
  METRIC_ACCENT,
  METRIC_NOUN,
  metricUnit,
  secondaryStats,
} from "./metrics";

interface LeaderboardPodiumProps {
  entries: RankedAttendee[];
  metric: LeaderboardMetric;
}

interface Medal {
  label: string;
  text: string;
  border: string;
  background: string;
}

// Gold and silver already exist in the landing palette. Bronze is the only
// new color of this phase.
const MEDALS: Record<number, Medal> = {
  1: {
    label: "1.º lugar",
    text: "text-peach",
    border: "border-peach/40",
    background: "bg-peach/10",
  },
  2: {
    label: "2.º lugar",
    text: "text-subtle",
    border: "border-subtle/40",
    background: "bg-subtle/10",
  },
  3: {
    label: "3.º lugar",
    text: "text-[#c98a5b]",
    border: "border-[#c98a5b]/40",
    background: "bg-[#c98a5b]/10",
  },
};

const NO_MEDAL: Medal = {
  label: "lugar",
  text: "text-muted",
  border: "border-stroke",
  background: "bg-surface-low",
};

// The taller the step, the higher the place. The first place is in the
// middle and stands on the tallest step.
const STEP_HEIGHTS = [
  "sm:min-h-[200px]",
  "sm:min-h-[250px]",
  "sm:min-h-[170px]",
];

export default function LeaderboardPodium({
  entries,
  metric,
}: LeaderboardPodiumProps) {
  if (entries.length === 0) {
    return null;
  }

  // Visual order: second place on the left, first place in the middle and
  // third place on the right. Fewer than three entries simply render the
  // ones that exist.
  const steps = [entries[1], entries[0], entries[2]].filter(
    (entry): entry is RankedAttendee => entry !== undefined,
  );

  return (
    <section className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
        Podio
      </p>
      <h2 className="mt-2 text-xl font-bold text-foreground">
        Los tres primeros por {METRIC_NOUN[metric]}
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        {steps.map((entry, index) => {
          const medal = MEDALS[entry.rank] ?? NO_MEDAL;
          const height = STEP_HEIGHTS[index] ?? STEP_HEIGHTS[0];

          return (
            <article
              key={entry.userId}
              className={`flex flex-col items-center justify-end rounded-xl border px-5 py-5 text-center shadow-2xl shadow-black/30 ${medal.border} ${medal.background} ${height} ${
                steps.length === 1 ? "sm:col-start-2" : ""
              }`}
            >
              <p className={`text-3xl font-black ${medal.text}`}>{entry.rank}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {medal.label}
              </p>
              <p className="mt-3 w-full truncate text-sm font-bold text-foreground">
                {entry.name}
              </p>
              <p
                className={`mt-2 text-2xl font-black ${METRIC_ACCENT[metric]}`}
              >
                {entry[metric]}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                {metricUnit(metric, entry[metric])}
              </p>
              <p className="mt-2 text-xs text-muted">
                {secondaryStats(entry, metric)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
