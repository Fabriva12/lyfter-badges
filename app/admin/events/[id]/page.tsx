import type { Metadata } from "next";
import Link from "next/link";

import DeleteEventForm from "@/components/admin/DeleteEventForm";
import EventForm from "@/components/admin/EventForm";
import EventGallery from "@/components/admin/EventGallery";
import EventTabs from "@/components/admin/EventTabs";
import Notice from "@/components/admin/Notice";
import ScanTable from "@/components/admin/ScanTable";
import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { formatDateTime } from "@/lib/admin/format";
import { getEventMetrics, getRecentEventScans } from "@/lib/admin/queries";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Evento · Admin · Lyfter Badges",
};

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function AdminEventPage({
  params,
  searchParams,
}: EventPageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { event } = await requireEventForAdmin(id);

  const [metrics, recentScans] = await Promise.all([
    getEventMetrics(event.id),
    getRecentEventScans(event.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-muted transition hover:text-foreground"
        >
          ← Todos los eventos
        </Link>

        <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">{event.name}</h1>
            <p className="mt-2 text-sm text-muted">
              Inicio: {formatDateTime(event.startsAt)}
            </p>
            <p className="mt-1 text-sm text-muted">
              Fin: {formatDateTime(event.endsAt)}
            </p>
            {event.location ? (
              <p className="mt-1 text-sm text-muted">
                {event.location}
                {event.country ? `, ${event.country}` : ""}
              </p>
            ) : null}
            <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="rounded-full border border-stroke px-3 py-1 text-muted">
                {EVENT_MODE_LABELS[event.mode] ?? event.mode}
              </span>
              <span className="rounded-full bg-celeste/15 px-3 py-1 text-celeste-soft">
                {EVENT_STATUS_LABELS[event.status] ?? event.status}
              </span>
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {event.slug}
            </p>
          </div>

          <Link
            href={`/leaderboard?event=${event.slug}`}
            className="rounded-lg border border-stroke px-4 py-2 text-sm font-semibold text-subtle transition hover:bg-ink"
          >
            Clasificación pública
          </Link>
        </header>
      </div>

      {saved === "1" ? (
        <Notice tone="success">Evento guardado. Las vistas públicas están actualizadas.</Notice>
      ) : null}

      {saved === "image" ? (
        <Notice tone="success">Galería actualizada.</Notice>
      ) : null}

      <EventTabs eventId={event.id} active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Asistentes" value={metrics.attendees} />
        <StatCard label="Escaneos" value={metrics.scans} />
        <StatCard label="Insignias" value={metrics.badges} />
        <StatCard
          label="Tokens QR activos"
          value={metrics.activeTokens}
          hint={`${metrics.xpAwarded} XP otorgados en este evento`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <EventForm event={event} />

        <section className={cardClassName}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-foreground">Escaneos recientes</h2>
            <Link
              href={`/admin/events/${event.id}/scans`}
              className="text-sm font-semibold text-celeste hover:text-celeste-soft"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-5">
            <ScanTable
              scans={recentScans}
              emptyMessage="Todavía nadie escaneó una insignia en este evento."
            />
          </div>
        </section>
      </div>

      <EventGallery eventId={event.id} images={event.images} />

      <DeleteEventForm
        eventId={event.id}
        eventName={event.name}
        attendees={metrics.attendees}
        scans={metrics.scans}
        badges={metrics.badges}
      />
    </div>
  );
}
