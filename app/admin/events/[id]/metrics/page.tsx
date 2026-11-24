import type { Metadata } from "next";
import Link from "next/link";

import EventTabs from "@/components/admin/EventTabs";
import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import {
  barWidth,
  formatHour,
  peakHour,
} from "@/lib/admin/metrics";
import { requireEventForAdmin } from "@/lib/admin/guards";
import {
  getEventMetricsDetail,
  type BadgeVisit,
} from "@/lib/admin/queries";
import { BadgeIcon } from "@/lib/badges/icons";
import { BADGE_RARITY_LABELS, BADGE_TYPE_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Métricas · Admin · Lyfter Badges",
};

interface MetricsPageProps {
  params: Promise<{ id: string }>;
}

interface BadgeVisitGroupProps {
  title: string;
  items: BadgeVisit[];
  maxScans: number;
}

function BadgeVisitGroup({ title, items, maxScans }: BadgeVisitGroupProps) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#9ca3af]">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#9ca3af]">Todavía no hay escaneos.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {items.map((badge) => (
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
                      {BADGE_TYPE_LABELS[badge.type] ?? badge.type}
                      {badge.room ? ` · ${badge.room}` : ""}
                      {badge.rarity !== "COMMON"
                        ? ` · ${BADGE_RARITY_LABELS[badge.rarity] ?? badge.rarity}`
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
                  style={{ width: `${barWidth(badge.scans, maxScans)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminMetricsPage({ params }: MetricsPageProps) {
  const { id } = await params;
  const { event } = await requireEventForAdmin(id);

  const metrics = await getEventMetricsDetail(event.id);
  const peak = peakHour(metrics.hourly);
  const busiestBadge = metrics.topBadges[0] ?? null;
  const maxHourly = Math.max(...metrics.hourly.map((bucket) => bucket.count), 1);
  const maxBadgeScans = Math.max(
    ...metrics.topBadges.map((badge) => badge.scans),
    1,
  );
  const talks = metrics.topBadges.filter((badge) => badge.type === "TALK");
  const stands = metrics.topBadges.filter((badge) => badge.type === "STAND");
  const otherBadges = metrics.topBadges.filter(
    (badge) => badge.type !== "TALK" && badge.type !== "STAND",
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Métricas</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Qué visitaron los asistentes y cuándo. Todas las horas son de Costa
          Rica.
        </p>
      </div>

      <EventTabs eventId={event.id} active="metrics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Escaneos" value={metrics.totalScans} />
        <StatCard label="Registrados" value={metrics.attendees} />
        <StatCard
          label="Obtuvieron una insignia"
          value={metrics.attendeesWithScans}
        />
        <StatCard
          label="XP otorgados"
          value={metrics.xpAwarded}
          hint={`${metrics.badges} insignias disponibles`}
        />
      </div>

      <section className={cardClassName}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-[#f1f1ed]">
            Insignias más visitadas
          </h2>
          {busiestBadge ? (
            <p className="text-sm text-[#9ca3af]">
              Más visitada: <span className="font-semibold text-[#f1f1ed]">{busiestBadge.name}</span>{" "}
              ({busiestBadge.scans} escaneos)
            </p>
          ) : null}
        </div>

        {metrics.topBadges.length === 0 ? (
          <p className="mt-5 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
            Agrega insignias a este evento para empezar a recopilar métricas.
          </p>
        ) : (
          <div className="mt-5 space-y-8">
            <BadgeVisitGroup
              title="Charlas"
              items={talks}
              maxScans={maxBadgeScans}
            />
            <BadgeVisitGroup
              title="Stands"
              items={stands}
              maxScans={maxBadgeScans}
            />
            {otherBadges.length > 0 ? (
              <BadgeVisitGroup
                title="Otras insignias"
                items={otherBadges}
                maxScans={maxBadgeScans}
              />
            ) : null}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={cardClassName}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-[#f1f1ed]">
              Asistencia por hora
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
          <h2 className="text-lg font-bold text-[#f1f1ed]">Escaneos por tipo</h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Qué tipo de insignia es la que más atrae a los asistentes.
          </p>

          {Object.keys(metrics.byType).length === 0 ? (
            <p className="mt-5 text-sm text-[#9ca3af]">Todavía no hay escaneos.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {Object.entries(metrics.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <li key={type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#d7dce3]">
                        {BADGE_TYPE_LABELS[type] ?? type}
                      </span>
                      <span className="text-[#a8d889]">{count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1f252d]">
                      <div
                        className="h-full rounded-full bg-[#a8d889]"
                        style={{
                          width: `${barWidth(count, Math.max(...Object.values(metrics.byType), 1))}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
