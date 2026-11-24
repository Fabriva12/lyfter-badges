import type { Metadata } from "next";
import Link from "next/link";

import EventTabs from "@/components/admin/EventTabs";
import ScanTable from "@/components/admin/ScanTable";
import { cardClassName, inputClassName } from "@/components/admin/formStyles";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { getEventScans } from "@/lib/admin/queries";
import { getLeaderboard } from "@/lib/gamification/queries";

export const metadata: Metadata = {
  title: "Escaneos · Admin · Lyfter Badges",
};

interface ScansPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

function pageHref(eventId: string, page: number, query: string) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (query) {
    params.set("q", query);
  }

  const suffix = params.toString();

  return `/admin/events/${eventId}/scans${suffix ? `?${suffix}` : ""}`;
}

export default async function AdminScansPage({
  params,
  searchParams,
}: ScansPageProps) {
  const { id } = await params;
  const { page, q } = await searchParams;
  const { event } = await requireEventForAdmin(id);

  const requestedPage = Number(page);

  const [scans, ranking] = await Promise.all([
    getEventScans(event.id, {
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
      query: q ?? "",
    }),
    getLeaderboard(event.id),
  ]);

  const totalPages = Math.max(Math.ceil(scans.total / scans.pageSize), 1);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Escaneos</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Todos los canjes de insignias de este evento, de los más recientes a
          los más antiguos.
        </p>
      </div>

      <EventTabs eventId={event.id} active="scans" />

      <section className={cardClassName}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#f1f1ed]">Registro de escaneos</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              {scans.total} {scans.total === 1 ? "canje" : "canjes"}
              {scans.query ? ` que coinciden con “${scans.query}”` : ""}.
            </p>
          </div>

          <form method="get" className="flex w-full max-w-sm gap-2">
            <input
              type="search"
              name="q"
              defaultValue={scans.query}
              placeholder="Asistente, correo o insignia"
              className={inputClassName}
            />
            <button
              type="submit"
              className="rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="mt-5">
          <ScanTable
            scans={scans.rows}
            emptyMessage="Ningún escaneo coincide con este filtro."
          />
        </div>

        {totalPages > 1 ? (
          <nav
            aria-label="Scan pages"
            className="mt-5 flex items-center justify-between gap-4 text-sm"
          >
            {scans.page > 1 ? (
              <Link
                href={pageHref(event.id, scans.page - 1, scans.query)}
                className="font-semibold text-[#36bde9] hover:text-[#7fd8f5]"
              >
                ← Newer
              </Link>
            ) : (
              <span />
            )}

            <span className="text-[#9ca3af]">
              Page {scans.page} of {totalPages}
            </span>

            {scans.page < totalPages ? (
              <Link
                href={pageHref(event.id, scans.page + 1, scans.query)}
                className="font-semibold text-[#36bde9] hover:text-[#7fd8f5]"
              >
                Older →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>

      {ranking.rows.length > 0 ? (
        <LeaderboardTable
          rows={ranking.rows.slice(0, 10)}
          currentUserId=""
          metric="xp"
        />
      ) : (
        <p className="rounded-xl border border-[#39424f] bg-[#252c35] px-4 py-8 text-center text-sm text-[#9ca3af]">
          The ranking appears as soon as the first badge is scanned.
        </p>
      )}
    </div>
  );
}
