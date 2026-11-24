import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ShareButtons from "@/components/share/ShareButtons";
import { formatDate } from "@/lib/date";
import { getRequestOrigin } from "@/lib/request";
import { buildShareText } from "@/lib/share";
import { loadPublicEventBadge } from "@/lib/share/collection";

interface BadgePageProps {
  params: Promise<{ eventBadgeId: string }>;
}

export async function generateMetadata({
  params,
}: BadgePageProps): Promise<Metadata> {
  const { eventBadgeId } = await params;
  const eventBadge = await loadPublicEventBadge(eventBadgeId);

  if (!eventBadge) {
    return { title: "Badge not found" };
  }

  const title = `${eventBadge.badge.name} · ${eventBadge.event.name}`;
  const description = `The ${eventBadge.badge.name} badge at ${eventBadge.event.name} is worth ${eventBadge.badge.xpValue} XP. Collect it with Lyfter Badges.`;

  return {
    title: eventBadge.badge.name,
    description,
    openGraph: {
      type: "website",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BadgePage({ params }: BadgePageProps) {
  const { eventBadgeId } = await params;
  const eventBadge = await loadPublicEventBadge(eventBadgeId);

  if (!eventBadge) {
    notFound();
  }

  const { badge, event } = eventBadge;
  const origin = await getRequestOrigin();
  const url = `${origin}/badge/${eventBadgeId}`;
  const imageUrl = `${origin}/badge/${eventBadgeId}/opengraph-image`;
  const text = buildShareText({
    badgeName: badge.name,
    eventName: event.name,
    xp: badge.xpValue,
  });
  const eventDate = formatDate(event.startsAt);

  return (
    <main className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            Badge
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{badge.name}</h1>
        </header>

        <div className="space-y-6 sm:space-y-8">
          <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 shadow-2xl shadow-black/30 sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
              {badge.imageUrl ? (
                <Image
                  src={badge.imageUrl}
                  alt={badge.name}
                  width={96}
                  height={96}
                  unoptimized
                  className="shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#a8d889] text-4xl font-black text-[#263021]"
                >
                  {badge.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-[#f1f1ed]">
                  {badge.name}
                </h2>
                {badge.description ? (
                  <p className="mt-2 text-sm text-[#d7dce3]">
                    {badge.description}
                  </p>
                ) : null}
                <p className="mt-3 text-sm font-semibold text-[#a8d889]">
                  +{badge.xpValue} XP
                </p>
                {eventBadge.room ? (
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {eventBadge.room}
                  </p>
                ) : null}
                <p className="mt-4 text-sm text-[#9ca3af]">{event.name}</p>
                <p className="mt-1 text-sm text-[#89919e]">{eventDate}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-xl font-bold text-[#f1f1ed]">
              Share this badge
            </h2>
            <p className="mt-2 text-sm text-[#9ca3af]">
              Show off what you collected and let the rest of the room know
              which talks are worth attending.
            </p>

            <div className="mt-6">
              <ShareButtons
                url={url}
                text={text}
                title={badge.name}
                imageUrl={imageUrl}
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#394351] bg-[#1f252d] p-5 text-center shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-lg font-bold text-[#f1f1ed]">
              Not collecting badges yet?
            </h2>
            <p className="mt-2 text-sm text-[#9ca3af]">
              Create an account, scan the QR codes at the talks and stands, and
              start your own collection.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#a8d889] px-6 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
            >
              Create an account
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
