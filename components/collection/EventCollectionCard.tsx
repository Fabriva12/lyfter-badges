import Image from "next/image";
import Link from "next/link";

import PrizePanel from "@/components/collection/PrizePanel";
import { formatEventRange } from "@/lib/date";
import type { EventCollection } from "@/lib/gamification/queries";
import { createShareToken } from "@/lib/share/token";

interface EventCollectionCardProps {
  collection: EventCollection;
  userId: string;
}

export default function EventCollectionCard({
  collection,
  userId,
}: EventCollectionCardProps) {
  const { progress, prize, badges } = collection;
  const percent = Math.round(progress.progress * 100);
  const shareHref =
    progress.collected > 0
      ? `/share/${createShareToken({
          userId,
          eventId: collection.eventId,
        })}`
      : null;

  return (
    <section className="rounded-xl border border-stroke bg-surface p-5 shadow-2xl shadow-black/30 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            {collection.eventName}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {formatEventRange(collection.startsAt, collection.endsAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-subtle">
            {progress.collected} / {progress.total} insignias
          </p>
          {shareHref ? (
            <Link
              href={shareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center rounded-lg border border-stroke px-3 text-xs font-semibold text-subtle transition hover:bg-ink"
            >
              Compartir
            </Link>
          ) : null}
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Progreso de la colección de insignias de ${collection.eventName}`}
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-stroke"
      >
        <div
          className="h-full rounded-full bg-celeste transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {prize ? <PrizePanel prize={prize} /> : null}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {badges.map((badge) => {
          const content = (
            <>
              {badge.imageUrl ? (
                <Image
                  src={badge.imageUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="rounded-lg object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                    badge.collected
                      ? "bg-sage text-[#263021]"
                      : "bg-stroke text-muted"
                  }`}
                >
                  {badge.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {badge.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {badge.collected
                    ? `+${badge.xpValue} XP · recolectada`
                    : `+${badge.xpValue} XP · sin recolectar`}
                  {badge.room ? ` · ${badge.room}` : ""}
                </p>
              </div>
            </>
          );

          return (
            <li
              key={badge.eventBadgeId}
              className={`rounded-lg border ${
                badge.collected
                  ? "border-sage/40 bg-sage/5"
                  : "border-stroke bg-surface-low opacity-70"
              }`}
            >
              {badge.collected ? (
                <Link
                  href={`/badge/${badge.eventBadgeId}`}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 transition hover:bg-sage/10"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-4 px-4 py-3">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
