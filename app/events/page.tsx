import type { Metadata } from "next";

import EventCard from "@/components/events/EventCard";
import {
  getEventSummaries,
  type EventSummary,
} from "@/lib/gamification/queries";

export const metadata: Metadata = {
  title: "Events · Lyfter Badges",
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
    <main className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            Lyfter events
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Events</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Browse the Lyfter events and jump into the leaderboard of each one.
          </p>
        </header>

        {loadFailed ? (
          <section className="rounded-xl border border-[#f47f8a]/40 bg-[#f47f8a]/10 px-6 py-8 text-center">
            <h2 className="text-lg font-bold text-[#ffb3ba]">
              Events are unavailable right now.
            </h2>
            <p className="mt-2 text-sm text-[#d7dce3]">
              We could not reach the event database. Please try again in a few
              minutes.
            </p>
          </section>
        ) : events.length === 0 ? (
          <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 text-center sm:p-8">
            <h2 className="text-lg font-bold text-[#f1f1ed]">
              There are no events yet.
            </h2>
            <p className="mt-2 text-sm text-[#9ca3af]">
              As soon as an organizer publishes an event, it shows up here.
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
