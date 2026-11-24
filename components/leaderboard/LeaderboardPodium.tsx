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
    label: "1st place",
    text: "text-[#ffc875]",
    border: "border-[#ffc875]/40",
    background: "bg-[#ffc875]/10",
  },
  2: {
    label: "2nd place",
    text: "text-[#d7dce3]",
    border: "border-[#d7dce3]/40",
    background: "bg-[#d7dce3]/10",
  },
  3: {
    label: "3rd place",
    text: "text-[#c98a5b]",
    border: "border-[#c98a5b]/40",
    background: "bg-[#c98a5b]/10",
  },
};

const NO_MEDAL: Medal = {
  label: "place",
  text: "text-[#9ca3af]",
  border: "border-[#39424f]",
  background: "bg-[#1f252d]",
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
    <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 shadow-2xl shadow-black/30 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
        Podium
      </p>
      <h2 className="mt-2 text-xl font-bold text-[#f1f1ed]">
        Top three by {METRIC_NOUN[metric]}
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
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
                {medal.label}
              </p>
              <p className="mt-3 w-full truncate text-sm font-bold text-[#f1f1ed]">
                {entry.name}
              </p>
              <p
                className={`mt-2 text-2xl font-black ${METRIC_ACCENT[metric]}`}
              >
                {entry[metric]}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {metricUnit(metric, entry[metric])}
              </p>
              <p className="mt-2 text-xs text-[#9ca3af]">
                {secondaryStats(entry, metric)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
