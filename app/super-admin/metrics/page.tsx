import type { Metadata } from "next";
import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { barWidth, formatHour, peakHour, topN } from "@/lib/admin/metrics";
import { requireSuperAdmin } from "@/lib/admin/guards";
import {
  getPlatformMetricsDetail,
  type PlatformBadgeVisit,
} from "@/lib/admin/queries";
import { BadgeIcon } from "@/lib/badges/icons";

const BADGE_RARITY_LABELS_ES: Record<string, string> = {
  COMMON: "Común",
  RARE: "Rara",
  LIMITED: "Edición limitada",
};

const BADGE_TYPE_LABELS_ES: Record<string, string> = {
  WELCOME: "Bienvenida",
  TALK: "Charla",
  STAND: "Stand",
  SPECIAL: "Especial",
};

export const metadata: Metadata = {
  title: "Métricas · Super admin · Lyfter Badges",
};

const TOP_LIMIT = 10;

function RankedBadgeList({
  badges,
  emptyMessage,
}: {
  badges: PlatformBadgeVisit[];
  emptyMessage: string;
}) {
  if (badges.length === 0) {
    return (
      <p className="mt-5 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
        {emptyMessage}
      </p>
    );
  }

  const max = Math.max(...badges.map((badge) => badge.scans), 1);

  return (
    <ul className="mt-5 space-y-4">
      {badges.map((badge) => (
        <li key={badge.eventBadgeId}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#39424f] bg-[#1f252d] text-[#9ca3af]">
                <BadgeIcon name={badge.iconKey} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#f1f1ed]">
                  {badge.name}
                </p>
                <p className="text-xs text-[#9ca3af]">
                  {badge.eventName}
                  {badge.room ? ` · ${badge.room}` : ""}
                  {badge.rarity !== "COMMON"
                    ? ` · ${BADGE_RARITY_LABELS_ES[badge.rarity] ?? badge.rarity}`
                    : ""}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-[#a8d889]">
              {badge.scans}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1f252d]">
            <div
              className="h-full rounded-full bg-[#36bde9]"
              style={{ width: `${barWidth(badge.scans, max)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function SuperAdminMetricsPage() {
  await requireSuperAdmin();
  const metrics = await getPlatformMetricsDetail();

  const peak = peakHour(metrics.hourly);
  const topTalks = topN(metrics.topTalks, TOP_LIMIT, (badge) => badge.scans);
  const topStands = topN(metrics.topStands, TOP_LIMIT, (badge) => badge.scans);
  const topEvents = metrics.topEvents.slice(0, TOP_LIMIT);
  const maxHourly = Math.max(...metrics.hourly.map((bucket) => bucket.count), 1);
  const maxEventScans = Math.max(
    ...topEvents.map((event) => event.scans),
    1,
  );
  const maxTypeCount = Math.max(...Object.values(metrics.byType), 1);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Super admin
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Métricas de la plataforma
        </h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Actividad de todos los eventos. Las horas están en hora de Costa Rica.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Escaneos" value={metrics.totalScans} />
        <StatCard
          label="Registros"
          value={metrics.totalRegistrations}
          hint={`${metrics.totalBadges} badges disponibles`}
        />
        <StatCard label="XP otorgado" value={metrics.totalXpAwarded} />
        <StatCard
          label="Hora pico"
          value={peak ? formatHour(peak.hour) : "—"}
          hint={peak ? `${peak.count} escaneos` : "Todavía no hay escaneos"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClassName}>
          <h2 className="text-lg font-bold text-[#f1f1ed]">
            Charlas más populares
          </h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Badges de charla con más escaneos en todos los eventos.
          </p>
          <RankedBadgeList
            badges={topTalks}
            emptyMessage="Todavía no hay escaneos de charlas."
          />
        </section>

        <section className={cardClassName}>
          <h2 className="text-lg font-bold text-[#f1f1ed]">
            Stands más populares
          </h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Badges de stand con más escaneos en todos los eventos.
          </p>
          <RankedBadgeList
            badges={topStands}
            emptyMessage="Todavía no hay escaneos de stands."
          />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={cardClassName}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-[#f1f1ed]">
              Afluencia por hora
            </h2>
            <p className="text-sm text-[#9ca3af]">
              {peak
                ? `Pico a las ${formatHour(peak.hour)} (${peak.count} escaneos)`
                : "Todavía no hay escaneos"}
            </p>
          </div>

          <div className="mt-6 flex h-48 items-end gap-1">
            {metrics.hourly.map((bucket) => {
              const isPeak = peak?.hour === bucket.hour;

              return (
                <div
                  key={bucket.hour}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  title={`${formatHour(bucket.hour)}: ${bucket.count} escaneos`}
                >
                  <div
                    className={`w-full rounded-t ${
                      isPeak ? "bg-[#a8d889]" : "bg-[#36bde9]/60"
                    }`}
                    style={{
                      height: `${Math.max(
                        barWidth(bucket.count, maxHourly),
                        bucket.count > 0 ? 4 : 0,
                      )}%`,
                    }}
                  />
                  <span className="text-[9px] text-[#6b7280]">
                    {bucket.hour % 3 === 0 ? formatHour(bucket.hour) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={cardClassName}>
          <h2 className="text-lg font-bold text-[#f1f1ed]">
            Escaneos por tipo
          </h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Con qué tipo de badge interactúan más los asistentes.
          </p>

          {Object.keys(metrics.byType).length === 0 ? (
            <p className="mt-5 text-sm text-[#9ca3af]">
              Todavía no hay escaneos.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {Object.entries(metrics.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <li key={type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#d7dce3]">
                        {BADGE_TYPE_LABELS_ES[type] ?? type}
                      </span>
                      <span className="text-[#a8d889]">{count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1f252d]">
                      <div
                        className="h-full rounded-full bg-[#a8d889]"
                        style={{ width: `${barWidth(count, maxTypeCount)}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">
          Eventos con más participación
        </h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Ordenados por asistentes registrados y luego por escaneos.
        </p>

        {topEvents.length === 0 ? (
          <p className="mt-5 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
            Todavía no hay eventos creados.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {topEvents.map((event) => (
              <li key={event.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="truncate font-semibold text-[#f1f1ed] transition hover:text-[#7fd8f5]"
                    >
                      {event.name}
                    </Link>
                    <p className="text-xs text-[#9ca3af]">
                      {event.companyName ?? "Sin empresa"} · {event.attendees}{" "}
                      asistentes · {event.scans} escaneos
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-[#a8d889]">
                    {event.attendees}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1f252d]">
                  <div
                    className="h-full rounded-full bg-[#36bde9]"
                    style={{
                      width: `${barWidth(event.scans, maxEventScans)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
