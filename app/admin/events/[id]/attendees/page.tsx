import type { Metadata } from "next";
import Link from "next/link";

import EventTabs from "@/components/admin/EventTabs";
import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatDateTime } from "@/lib/admin/format";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { getEventAttendees } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Participantes · Admin · Lyfter Badges",
};

interface AttendeesPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAttendeesPage({
  params,
}: AttendeesPageProps) {
  const { id } = await params;
  const { event } = await requireEventForAdmin(id);

  const attendees = await getEventAttendees(event.id);
  const totalBadges = attendees.reduce(
    (total, attendee) => total + attendee.badges.length,
    0,
  );
  const checkedIn = attendees.filter(
    (attendee) => attendee.badges.length > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Participantes</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Asistentes registrados, las insignias que canjeó cada uno y su XP en
          este evento.
        </p>
      </div>

      <EventTabs eventId={event.id} active="attendees" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registrados" value={attendees.length} />
        <StatCard label="Obtuvieron una insignia" value={checkedIn} />
        <StatCard label="Insignias canjeadas" value={totalBadges} />
      </div>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Lista de asistentes</h2>

        {attendees.length === 0 ? (
          <p className="mt-5 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
            Todavía nadie se registró en este evento.
          </p>
        ) : (
          <>
            <ul className="mt-5 space-y-3 md:hidden">
              {attendees.map((attendee) => (
                <li
                  key={attendee.userId}
                  className="rounded-lg border border-[#39424f] bg-[#1f252d] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#f1f1ed]">
                        {attendee.name}
                      </p>
                      <p className="truncate text-xs text-[#6b7280]">
                        {attendee.email}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#a8d889]">
                      {attendee.xpEarned} XP
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-[#9ca3af]">
                    Registrado el {formatDateTime(attendee.registeredAt)}
                  </p>

                  <div className="mt-3">
                    {attendee.badges.length === 0 ? (
                      <span className="text-xs text-[#6b7280]">Aún no</span>
                    ) : (
                      <ul className="flex flex-wrap gap-1.5">
                        {attendee.badges.map((badge) => (
                          <li
                            key={badge.eventBadgeId}
                            className="rounded-full bg-[#36bde9]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7fd8f5]"
                            title={`${formatDateTime(badge.scannedAt)}`}
                          >
                            {badge.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-widest text-[#9ca3af]">
                  <tr>
                    <th className="py-2 pr-4 font-semibold">Asistente</th>
                    <th className="py-2 pr-4 font-semibold">Registrado</th>
                    <th className="py-2 pr-4 font-semibold">Insignias canjeadas</th>
                    <th className="py-2 font-semibold">XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#303743]">
                  {attendees.map((attendee) => (
                    <tr key={attendee.userId}>
                      <td className="py-3 pr-4 align-top text-[#f1f1ed]">
                        {attendee.name}
                        <span className="block text-xs text-[#6b7280]">
                          {attendee.email}
                        </span>
                      </td>
                      <td className="py-3 pr-4 align-top text-[#9ca3af]">
                        {formatDateTime(attendee.registeredAt)}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        {attendee.badges.length === 0 ? (
                          <span className="text-[#6b7280]">Aún no</span>
                        ) : (
                          <ul className="flex flex-wrap gap-1.5">
                            {attendee.badges.map((badge) => (
                              <li
                                key={badge.eventBadgeId}
                                className="rounded-full bg-[#36bde9]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7fd8f5]"
                                title={`${formatDateTime(badge.scannedAt)}`}
                              >
                                {badge.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 align-top font-semibold text-[#a8d889]">
                        {attendee.xpEarned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
