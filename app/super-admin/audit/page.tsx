import type { Metadata } from "next";
import Link from "next/link";

import {
  cardClassName,
  inputClassName,
} from "@/components/admin/formStyles";
import { formatDateTime } from "@/lib/admin/format";
import { requireSuperAdmin } from "@/lib/admin/guards";
import {
  getAuditActionOptions,
  getCompanyOptions,
  getEventOptions,
  getPlatformAuditLogs,
} from "@/lib/admin/queries";
import { auditActionLabelEs, ROLE_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Auditoría · Super admin · Lyfter Badges",
};

interface AuditPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    companyId?: string;
    eventId?: string;
    action?: string;
  }>;
}

interface AuditFilters {
  query: string;
  companyId: string;
  eventId: string;
  action: string;
}

function auditHref(page: number, filters: AuditFilters) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.companyId) {
    params.set("companyId", filters.companyId);
  }

  if (filters.eventId) {
    params.set("eventId", filters.eventId);
  }

  if (filters.action) {
    params.set("action", filters.action);
  }

  const suffix = params.toString();

  return `/super-admin/audit${suffix ? `?${suffix}` : ""}`;
}

export default async function SuperAdminAuditPage({
  searchParams,
}: AuditPageProps) {
  await requireSuperAdmin();
  const { page, q, companyId, eventId, action } = await searchParams;

  const requestedPage = Number(page);

  const [logs, companies, events, actions] = await Promise.all([
    getPlatformAuditLogs({
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
      query: q ?? "",
      companyId: companyId ?? "",
      eventId: eventId ?? "",
      action: action ?? "",
    }),
    getCompanyOptions(),
    getEventOptions(),
    getAuditActionOptions(),
  ]);

  const totalPages = Math.max(Math.ceil(logs.total / logs.pageSize), 1);
  const filters: AuditFilters = {
    query: logs.query,
    companyId: logs.companyId,
    eventId: logs.eventId,
    action: logs.action,
  };
  const hasFilters = Boolean(
    logs.query || logs.companyId || logs.eventId || logs.action,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Super admin
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Auditoría</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Cada acción administrativa relevante de la plataforma, de la más
          reciente a la más antigua. Las horas están en hora de Costa Rica.
        </p>
      </header>

      <section className={cardClassName}>
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="audit-q" className="sr-only">
              Buscar
            </label>
            <input
              id="audit-q"
              type="search"
              name="q"
              defaultValue={logs.query}
              placeholder="Actor, detalle o alcance"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="audit-company" className="sr-only">
              Empresa
            </label>
            <select
              id="audit-company"
              name="companyId"
              defaultValue={logs.companyId}
              className={inputClassName}
            >
              <option value="">Todas las empresas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="audit-event" className="sr-only">
              Evento
            </label>
            <select
              id="audit-event"
              name="eventId"
              defaultValue={logs.eventId}
              className={inputClassName}
            >
              <option value="">Todos los eventos</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="audit-action" className="sr-only">
              Acción
            </label>
            <select
              id="audit-action"
              name="action"
              defaultValue={logs.action}
              className={inputClassName}
            >
              <option value="">Todas las acciones</option>
              {actions.map((option) => (
                <option key={option} value={option}>
                  {auditActionLabelEs(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Filtrar
            </button>
            {hasFilters ? (
              <Link
                href="/super-admin/audit"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
              >
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>

        <p className="mt-5 text-sm text-[#9ca3af]">
          {logs.total} {logs.total === 1 ? "entrada" : "entradas"}
          {logs.query ? ` que coinciden con «${logs.query}»` : ""}.
        </p>

        <div className="mt-4 overflow-x-auto">
          {logs.rows.length === 0 ? (
            <p className="rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-8 text-center text-sm text-[#9ca3af]">
              Ninguna entrada de auditoría coincide con este filtro.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-[#9ca3af]">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Cuándo</th>
                  <th className="py-2 pr-4 font-semibold">Actor</th>
                  <th className="py-2 pr-4 font-semibold">Acción</th>
                  <th className="py-2 pr-4 font-semibold">Alcance</th>
                  <th className="py-2 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303743]">
                {logs.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap py-3 pr-4 align-top text-[#9ca3af]">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="py-3 pr-4 align-top text-[#f1f1ed]">
                      {row.actorName}
                      <span className="block text-xs text-[#6b7280]">
                        {row.actorRole
                          ? (ROLE_LABELS[row.actorRole] ?? row.actorRole)
                          : "Rol desconocido"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className="whitespace-nowrap rounded-full bg-[#36bde9]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7fd8f5]">
                        {auditActionLabelEs(row.action)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top text-xs text-[#9ca3af]">
                      {row.eventName ?? row.companyName ?? "Toda la plataforma"}
                    </td>
                    <td className="py-3 align-top text-[#d7dce3]">
                      {row.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 ? (
          <nav
            aria-label="Páginas de auditoría"
            className="mt-5 flex items-center justify-between gap-4 text-sm"
          >
            {logs.page > 1 ? (
              <Link
                href={auditHref(logs.page - 1, filters)}
                className="font-semibold text-[#36bde9] hover:text-[#7fd8f5]"
              >
                ← Más recientes
              </Link>
            ) : (
              <span />
            )}

            <span className="text-[#9ca3af]">
              Página {logs.page} de {totalPages}
            </span>

            {logs.page < totalPages ? (
              <Link
                href={auditHref(logs.page + 1, filters)}
                className="font-semibold text-[#36bde9] hover:text-[#7fd8f5]"
              >
                Más antiguas →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
