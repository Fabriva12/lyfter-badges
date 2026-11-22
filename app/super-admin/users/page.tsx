import type { Metadata } from "next";
import Link from "next/link";

import {
  cardClassName,
  inputClassName,
} from "@/components/admin/formStyles";
import UserRoleForm from "@/components/admin/super-admin/UserRoleForm";
import { formatDateTime } from "@/lib/admin/format";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { getPlatformUsers } from "@/lib/admin/queries";
import { ROLE_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Usuarios · Super admin · Lyfter Badges",
};

interface UsersPageProps {
  searchParams: Promise<{ page?: string; q?: string; role?: string }>;
}

function usersHref(page: number, query: string, role: string) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (query) {
    params.set("q", query);
  }

  if (role) {
    params.set("role", role);
  }

  const suffix = params.toString();

  return `/super-admin/users${suffix ? `?${suffix}` : ""}`;
}

export default async function SuperAdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const session = await requireSuperAdmin();
  const { page, q, role } = await searchParams;

  const requestedPage = Number(page);

  const users = await getPlatformUsers({
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    query: q ?? "",
    role: role ?? "",
  });

  const totalPages = Math.max(Math.ceil(users.total / users.pageSize), 1);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Super admin
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Usuarios</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Todas las cuentas de la plataforma. Los super admins pueden ajustar
          roles; las asignaciones a empresas y stands se gestionan desde la
          sección Empresas.
        </p>
      </header>

      <section className={cardClassName}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#f1f1ed]">Cuentas</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              {users.total} {users.total === 1 ? "cuenta" : "cuentas"}
              {users.query ? ` que coinciden con «${users.query}»` : ""}
              {users.role
                ? ` · ${ROLE_LABELS[users.role] ?? users.role}`
                : ""}
              .
            </p>
          </div>

          <form
            method="get"
            className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap"
          >
            <input
              type="search"
              name="q"
              defaultValue={users.query}
              placeholder="Nombre o email"
              className={`${inputClassName} sm:max-w-xs`}
            />
            <select
              name="role"
              defaultValue={users.role}
              aria-label="Rol"
              className={`${inputClassName} sm:w-40`}
            >
              <option value="">Todos los roles</option>
              <option value="ATTENDEE">Asistente</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </select>
            <button
              type="submit"
              className="rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Filtrar
            </button>
          </form>
        </div>

        <div className="mt-5 overflow-x-auto">
          {users.rows.length === 0 ? (
            <p className="rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-8 text-center text-sm text-[#9ca3af]">
              Ninguna cuenta coincide con este filtro.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-[#9ca3af]">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Cuenta</th>
                  <th className="py-2 pr-4 font-semibold">Rol</th>
                  <th className="py-2 pr-4 font-semibold">Empresas</th>
                  <th className="py-2 pr-4 font-semibold">Actividad</th>
                  <th className="py-2 font-semibold">Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303743]">
                {users.rows.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4 align-top text-[#f1f1ed]">
                      {user.name}
                      <span className="block text-xs text-[#6b7280]">
                        {user.email}
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <UserRoleForm
                        userId={user.id}
                        role={user.role}
                        disabled={user.id === session.user.id}
                      />
                    </td>
                    <td className="py-3 pr-4 align-top text-[#d7dce3]">
                      {user.companies.length > 0
                        ? user.companies.join(", ")
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 align-top text-xs text-[#9ca3af]">
                      {user.registrations} registros · {user.scans} escaneos
                      {user.events > 0 ? ` · ${user.events} organizados` : ""}
                    </td>
                    <td className="whitespace-nowrap py-3 align-top text-xs text-[#9ca3af]">
                      {formatDateTime(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 ? (
          <nav
            aria-label="Páginas de usuarios"
            className="mt-5 flex items-center justify-between gap-4 text-sm"
          >
            {users.page > 1 ? (
              <Link
                href={usersHref(users.page - 1, users.query, users.role)}
                className="font-semibold text-[#36bde9] hover:text-[#7fd8f5]"
              >
                ← Anterior
              </Link>
            ) : (
              <span />
            )}

            <span className="text-[#9ca3af]">
              Página {users.page} de {totalPages}
            </span>

            {users.page < totalPages ? (
              <Link
                href={usersHref(users.page + 1, users.query, users.role)}
                className="font-semibold text-[#36bde9] hover:text-[#7fd8f5]"
              >
                Siguiente →
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
