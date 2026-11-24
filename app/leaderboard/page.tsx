import type { Metadata } from "next";

import EventSelector from "@/components/leaderboard/EventSelector";
import LeaderboardPodium from "@/components/leaderboard/LeaderboardPodium";
import LeaderboardTable, {
  AttendeeRow,
} from "@/components/leaderboard/LeaderboardTable";
import MetricSelector from "@/components/leaderboard/MetricSelector";
import { formatEventRange } from "@/lib/date";
import {
  isLeaderboardMetric,
  type LeaderboardMetric,
} from "@/lib/gamification/leaderboard";
import {
  getEventSummaries,
  getGlobalLeaderboard,
  getLeaderboard,
} from "@/lib/gamification/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ranking · Lyfter Badges",
};

const TOP_ROWS = 10;

const METRIC_DESCRIPTION: Record<LeaderboardMetric, string> = {
  xp: "XP ganada",
  stands: "insignias de stands visitadas",
  talks: "insignias de charlas asistidas",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; metric?: string }>;
}) {
  const session = await requireSession();
  const { event: requestedSlug, metric: requestedMetric } = await searchParams;
  const events = await getEventSummaries();
  const metric: LeaderboardMetric = isLeaderboardMetric(requestedMetric)
    ? requestedMetric
    : "xp";
  const selected = requestedSlug
    ? (events.find((event) => event.slug === requestedSlug) ?? null)
    : null;
  const isGlobal = selected === null;

  const ranking = selected
    ? await getLeaderboard(selected.id, metric)
    : await getGlobalLeaderboard(metric);
  const rows = ranking.rows;
  const topRows = rows.slice(0, TOP_ROWS);
  const currentUser =
    rows.find((row) => row.userId === session.user.id) ?? null;
  const isCurrentUserOutsideTop =
    currentUser !== null &&
    !topRows.some((row) => row.userId === currentUser.userId);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            {isGlobal ? "Todos los eventos" : "Ranking por evento"}
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Ranking</h1>
          <p className="mt-2 text-sm text-muted">
            {isGlobal
              ? `Ordenado por ${METRIC_DESCRIPTION[metric]} en todos los eventos. Elige un alcance o cambia la métrica más abajo.`
              : `Ordenado por ${METRIC_DESCRIPTION[metric]} dentro de un solo evento. Solo cuentan las insignias de ese evento, así que cada evento es una competencia justa.`}
          </p>
        </header>

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <EventSelector
              events={events}
              activeSlug={selected?.slug ?? null}
              activeMetric={metric}
            />
            <MetricSelector
              activeMetric={metric}
              eventSlug={selected?.slug ?? null}
            />
          </div>

          <section className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-xl font-bold text-foreground">
              {isGlobal ? "Ranking global" : (selected?.name ?? "")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isGlobal
                ? "Cada asistente con al menos una insignia, en todos los eventos."
                : `${formatEventRange(selected.startsAt, selected.endsAt)}${
                    selected.location ? ` · ${selected.location}` : ""
                  }`}
            </p>
          </section>

          {rows.length === 0 ? (
            <section className="rounded-xl border border-stroke bg-surface p-5 text-center shadow-2xl shadow-black/30 sm:p-8">
              <h2 className="text-lg font-bold text-foreground">
                Nadie tiene puntos todavía{isGlobal ? "" : " en este evento"}.
              </h2>
              <p className="mt-2 text-sm text-muted">
                El ranking aparece en cuanto el primer asistente escanea una
                insignia.
              </p>
            </section>
          ) : (
            <>
              <LeaderboardPodium entries={ranking.top} metric={metric} />

              <LeaderboardTable
                rows={topRows}
                currentUserId={session.user.id}
                metric={metric}
              />

              {isCurrentUserOutsideTop && currentUser ? (
                <section className="rounded-xl border border-celeste/40 bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
                    Tu posición
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-foreground">
                    Estás fuera del top {TOP_ROWS}
                  </h2>

                  <div className="mt-6">
                    <AttendeeRow
                      row={currentUser}
                      isCurrent
                      metric={metric}
                    />
                  </div>

                  <p className="mt-4 text-sm text-muted">
                    Sigue escaneando insignias para subir en el ranking.
                  </p>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
