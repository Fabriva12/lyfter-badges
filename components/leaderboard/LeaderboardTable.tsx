import Image from "next/image";

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

interface LeaderboardTableProps {
  rows: RankedAttendee[];
  currentUserId: string;
  metric: LeaderboardMetric;
}

interface AttendeeRowProps {
  row: RankedAttendee;
  isCurrent: boolean;
  metric: LeaderboardMetric;
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#39424f] text-sm font-black text-[#9ca3af]"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * A single attendee as a stacked card. Used by the mobile list and by the
 * "Your position" card, so both read the same.
 */
export function AttendeeRow({ row, isCurrent, metric }: AttendeeRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-3 sm:gap-4 sm:px-4 ${
        isCurrent
          ? "border-[#36bde9]/50 bg-[#36bde9]/10"
          : "border-[#39424f] bg-[#1f252d]"
      }`}
    >
      <span className="w-10 shrink-0 text-sm font-bold text-[#9ca3af]">
        #{row.rank}
      </span>

      <Avatar name={row.name} image={row.image} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#f1f1ed]">
          {row.name}
        </p>
        <p className="text-xs text-[#9ca3af]">{secondaryStats(row, metric)}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-2xl font-black ${METRIC_ACCENT[metric]}`}>
          {row[metric]}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          {metricUnit(metric, row[metric])}
        </p>
      </div>
    </div>
  );
}

export default function LeaderboardTable({
  rows,
  currentUserId,
  metric,
}: LeaderboardTableProps) {
  return (
    <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 shadow-2xl shadow-black/30 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
        Ranking
      </p>
      <h2 className="mt-2 text-xl font-bold text-[#f1f1ed]">
        Top 10 by {METRIC_NOUN[metric]}
      </h2>

      <ul className="mt-6 space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.userId}>
            <AttendeeRow
              row={row}
              isCurrent={row.userId === currentUserId}
              metric={metric}
            />
          </li>
        ))}
      </ul>

      <div className="mt-6 hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#39424f] text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
              <th scope="col" className="pb-3 pr-4">
                Rank
              </th>
              <th scope="col" className="pb-3 pr-4">
                Attendee
              </th>
              <th
                scope="col"
                className={`pb-3 pr-4 text-right ${
                  metric === "stands" ? METRIC_ACCENT.stands : ""
                }`}
              >
                Stands
              </th>
              <th
                scope="col"
                className={`pb-3 pr-4 text-right ${
                  metric === "talks" ? METRIC_ACCENT.talks : ""
                }`}
              >
                Talks
              </th>
              <th
                scope="col"
                className={`pb-3 text-right ${
                  metric === "xp" ? METRIC_ACCENT.xp : ""
                }`}
              >
                XP
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const isCurrent = row.userId === currentUserId;

              return (
                <tr
                  key={row.userId}
                  className={`border-b border-[#39424f] ${
                    isCurrent ? "bg-[#36bde9]/10" : ""
                  }`}
                >
                  <td className="py-4 pr-4 text-3xl font-black text-[#f1f1ed]">
                    {row.rank}
                  </td>

                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={row.name} image={row.image} />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#f1f1ed]">
                          {row.name}
                          {isCurrent ? (
                            <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
                              You
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-[#9ca3af]">
                          {row.badges}{" "}
                          {row.badges === 1 ? "badge" : "badges"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td
                    className={`py-4 pr-4 text-right ${
                      metric === "stands"
                        ? `font-bold ${METRIC_ACCENT.stands}`
                        : "text-[#9ca3af]"
                    }`}
                  >
                    {row.stands}
                  </td>

                  <td
                    className={`py-4 pr-4 text-right ${
                      metric === "talks"
                        ? `font-bold ${METRIC_ACCENT.talks}`
                        : "text-[#9ca3af]"
                    }`}
                  >
                    {row.talks}
                  </td>

                  <td
                    className={`py-4 text-right ${
                      metric === "xp"
                        ? `font-bold ${METRIC_ACCENT.xp}`
                        : "text-[#9ca3af]"
                    }`}
                  >
                    {row.xp}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
