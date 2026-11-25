import Link from "next/link";

import CreateEventForm from "@/components/admin/CreateEventForm";
import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatEventRange } from "@/lib/admin/format";
import type {
  AdminCompany,
  CompanyEventSummary,
} from "@/lib/admin/queries";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";

interface OrganizerDashboardProps {
  events: CompanyEventSummary[];
  companies: AdminCompany[];
}

export default function OrganizerDashboard({
  events,
  companies,
}: OrganizerDashboardProps) {
  const totals = events.reduce(
    (accumulator, event) => ({
      attendees: accumulator.attendees + event.attendees,
      scans: accumulator.scans + event.scans,
      badges: accumulator.badges + event.badges,
    }),
    { attendees: 0, scans: 0, badges: 0 },
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Eventos de tus empresas
          </h1>
          <p className="mt-2 text-sm text-muted">
            Administrá las insignias, los tokens QR y el premio del evento. Ves
            los eventos de todas las empresas que administrás.
          </p>
        </div>

        <Link
          href="/admin/audit"
          className="rounded-lg border border-stroke px-4 py-2 text-sm font-semibold text-subtle transition hover:bg-ink"
        >
          Auditoría
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Eventos" value={events.length} />
        <StatCard label="Asistentes" value={totals.attendees} />
        <StatCard
          label="Escaneos"
          value={totals.scans}
          hint={`${totals.badges} insignias en todos los eventos`}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Lista de eventos</h2>

        {events.length === 0 ? (
          <p className="rounded-xl border border-stroke bg-surface px-4 py-8 text-center text-sm text-muted">
            Todavía no tenés eventos. Creá el primero abajo.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {events.map((event) => (
              <li key={event.id} className={cardClassName}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {event.name}
                    </h3>
                    {event.companyName ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-celeste-soft">
                        {event.companyName}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted">
                      {formatEventRange(event.startsAt, event.endsAt)}
                    </p>
                    {event.location ? (
                      <p className="mt-1 text-sm text-muted">
                        {event.location}
                        {event.country ? `, ${event.country}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="rounded-full border border-stroke px-2.5 py-0.5 text-muted">
                        {EVENT_MODE_LABELS[event.mode] ?? event.mode}
                      </span>
                      <span className="rounded-full bg-celeste/15 px-2.5 py-0.5 text-celeste-soft">
                        {EVENT_STATUS_LABELS[event.status] ?? event.status}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full border border-stroke px-3 py-1 font-mono text-xs text-muted">
                    {event.slug}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-surface-low px-2 py-3">
                    <dt className="text-xs text-muted">Asistentes</dt>
                    <dd className="mt-1 text-lg font-bold">
                      {event.attendees}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-low px-2 py-3">
                    <dt className="text-xs text-muted">Escaneos</dt>
                    <dd className="mt-1 text-lg font-bold">{event.scans}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-low px-2 py-3">
                    <dt className="text-xs text-muted">Insignias</dt>
                    <dd className="mt-1 text-lg font-bold">{event.badges}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="rounded-lg bg-sage px-4 py-2 text-[#263021] transition hover:bg-sage-soft"
                  >
                    Administrar evento
                  </Link>
                  <Link
                    href={`/leaderboard?event=${event.slug}`}
                    className="rounded-lg border border-stroke px-4 py-2 text-subtle transition hover:bg-ink"
                  >
                    Clasificación pública
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="max-w-2xl">
        <CreateEventForm companies={companies} />
      </section>
    </div>
  );
}
