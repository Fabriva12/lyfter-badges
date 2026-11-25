import type { Metadata } from "next";

import EventCard from "@/components/events/EventCard";
import {
  getEventSummaries,
  type EventSummary,
} from "@/lib/gamification/queries";

export const metadata: Metadata = {
  title: "Eventos · Lyfter Badges",
};

// Read the event list at request time instead of freezing it at build time:
// a new event must show up without a redeploy, and a database outage must not
// become the permanent cached page.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  let events: EventSummary[] = [];
  let loadFailed = false;

  try {
    events = await getEventSummaries();
  } catch (error) {
    // The page is public and the database may be unreachable (for example a
    // paused Supabase project). An empty list would lie; a dedicated message
    // is honest and keeps the rest of the site online.
    console.error(error);
    loadFailed = true;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Eventos de Lyfter
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Eventos</h1>
          <p className="mt-2 text-sm text-muted">
            Explora los eventos de Lyfter y entra al ranking de cada uno.
          </p>
        </header>

        {loadFailed ? (
          <section className="rounded-xl border border-coral/40 bg-coral/10 px-6 py-8 text-center">
            <h2 className="text-lg font-bold text-coral-soft">
              Los eventos no están disponibles en este momento.
            </h2>
            <p className="mt-2 text-sm text-subtle">
              No pudimos acceder a la base de datos de eventos. Inténtalo de nuevo en
              unos minutos.
            </p>
          </section>
        ) : events.length === 0 ? (
          <section className="rounded-xl border border-stroke bg-surface p-5 text-center sm:p-8">
            <h2 className="text-lg font-bold text-foreground">
              Todavía no hay eventos.
            </h2>
            <p className="mt-2 text-sm text-muted">
              En cuanto un organizador publique un evento, aparecerá aquí.
            </p>
          </section>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
