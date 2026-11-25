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
    return { title: "Insignia no encontrada" };
  }

  const title = `${eventBadge.badge.name} · ${eventBadge.event.name}`;
  const description = `La insignia ${eventBadge.badge.name} en ${eventBadge.event.name} vale ${eventBadge.badge.xpValue} XP. Recolecta la con Lyfter Badges.`;

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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:py-16">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-celeste">
            Insignia
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{badge.name}</h1>
        </header>

        <div className="space-y-6 sm:space-y-8">
          <section className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
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
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-sage text-4xl font-black text-[#263021]"
                >
                  {badge.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {badge.name}
                </h2>
                {badge.description ? (
                  <p className="mt-2 text-sm text-subtle">
                    {badge.description}
                  </p>
                ) : null}
                <p className="mt-3 text-sm font-semibold text-sage">
                  +{badge.xpValue} XP
                </p>
                {eventBadge.room ? (
                  <p className="mt-1 text-sm text-muted">
                    {eventBadge.room}
                  </p>
                ) : null}
                <p className="mt-4 text-sm text-muted">{event.name}</p>
                <p className="mt-1 text-sm text-muted">{eventDate}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-xl font-bold text-foreground">
              Comparte esta insignia
            </h2>
            <p className="mt-2 text-sm text-muted">
              Muestra lo que recolectaste y cuéntale al resto del público qué
              charlas valen la pena.
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

          <section className="rounded-xl border border-stroke bg-surface-low p-5 text-center shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-lg font-bold text-foreground">
              ¿Todavía no recolectas insignias?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Crea una cuenta, escanea los códigos QR de las charlas y los stands,
              y empieza tu propia colección.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-sage px-6 text-sm font-bold text-[#263021] transition hover:bg-sage-soft"
            >
              Crear cuenta
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
