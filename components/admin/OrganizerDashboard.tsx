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
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Eventos de tus empresas
          </h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Administrá las insignias, los tokens QR y el premio del evento. Ves
            los eventos de todas las empresas que administrás.
          </p>
        </div>

        <Link
          href="/admin/audit"
          className="rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
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
        <h2 className="text-lg font-bold text-[#f1f1ed]">Lista de eventos</h2>

        {events.length === 0 ? (
          <p className="rounded-xl border border-[#39424f] bg-[#252c35] px-4 py-8 text-center text-sm text-[#9ca3af]">
            Todavía no tenés eventos. Creá el primero abajo.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {events.map((event) => (
              <li key={event.id} className={cardClassName}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#f1f1ed]">
                      {event.name}
                    </h3>
                    {event.companyName ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#7fd8f5]">
                        {event.companyName}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-[#9ca3af]">
                      {formatEventRange(event.startsAt, event.endsAt)}
                    </p>
                    {event.location ? (
                      <p className="mt-1 text-sm text-[#9ca3af]">
                        {event.location}
                        {event.country ? `, ${event.country}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="rounded-full border border-[#39424f] px-2.5 py-0.5 text-[#9ca3af]">
                        {EVENT_MODE_LABELS[event.mode] ?? event.mode}
                      </span>
                      <span className="rounded-full bg-[#36bde9]/15 px-2.5 py-0.5 text-[#7fd8f5]">
                        {EVENT_STATUS_LABELS[event.status] ?? event.status}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full border border-[#394351] px-3 py-1 font-mono text-xs text-[#9ca3af]">
                    {event.slug}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-[#1f252d] px-2 py-3">
                    <dt className="text-xs text-[#9ca3af]">Asistentes</dt>
                    <dd className="mt-1 text-lg font-bold">
                      {event.attendees}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-[#1f252d] px-2 py-3">
                    <dt className="text-xs text-[#9ca3af]">Escaneos</dt>
                    <dd className="mt-1 text-lg font-bold">{event.scans}</dd>
                  </div>
                  <div className="rounded-lg bg-[#1f252d] px-2 py-3">
                    <dt className="text-xs text-[#9ca3af]">Insignias</dt>
                    <dd className="mt-1 text-lg font-bold">{event.badges}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="rounded-lg bg-[#a8d889] px-4 py-2 text-[#263021] transition hover:bg-[#b8e39a]"
                  >
                    Administrar evento
                  </Link>
                  <Link
                    href={`/leaderboard?event=${event.slug}`}
                    className="rounded-lg border border-[#394351] px-4 py-2 text-[#d7dce3] transition hover:bg-[#272d36]"
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
