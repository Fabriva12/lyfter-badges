import type { Metadata } from "next";
import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { getPlatformOverview } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Super admin · Lyfter Badges",
};

const SECTIONS = [
  {
    href: "/super-admin/companies",
    title: "Empresas",
    description:
      "Crea empresas y administra a los admins que gestionan sus eventos.",
  },
  {
    href: "/super-admin/events",
    title: "Eventos",
    description: "Explora y abre cualquier evento de la plataforma.",
  },
  {
    href: "/super-admin/users",
    title: "Usuarios",
    description: "Busca cuentas y ajusta roles en toda la plataforma.",
  },
  {
    href: "/super-admin/metrics",
    title: "Métricas",
    description:
      "Charlas y stands más populares, horarios de mayor afluencia y eventos con más participación.",
  },
  {
    href: "/super-admin/audit",
    title: "Auditoría",
    description:
      "Cada acción administrativa relevante, de la más reciente a la más antigua.",
  },
] as const;

export default async function SuperAdminPage() {
  await requireSuperAdmin();
  const overview = await getPlatformOverview();

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Super admin
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Resumen de la plataforma
        </h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Visibilidad total sobre cada empresa, evento, cuenta y escaneo de la
          plataforma.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Usuarios"
          value={overview.users}
          hint={`${overview.attendees} asistentes · ${overview.admins} admins`}
        />
        <StatCard
          label="Empresas"
          value={overview.companies}
          hint={`${overview.superAdmins} super admin${overview.superAdmins === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Eventos"
          value={overview.events}
          hint={`${overview.activeEvents} activos`}
        />
        <StatCard
          label="Escaneos"
          value={overview.scans}
          hint={`${overview.registrations} registros`}
        />
      </div>

      <section>
        <h2 className="text-lg font-bold text-[#f1f1ed]">
          Gestionar la plataforma
        </h2>
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`${cardClassName} block transition hover:border-[#36bde9]/60 hover:bg-[#2a323c]`}
              >
                <h3 className="text-base font-bold text-[#f1f1ed]">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-[#9ca3af]">
                  {section.description}
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-[#7fd8f5]">
                  Abrir →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Gamificación</h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Los asistentes acumularon{" "}
          <span className="font-semibold text-[#a8d889]">
            {overview.xpAwarded} XP
          </span>{" "}
          en todos los eventos.
        </p>
      </section>
    </div>
  );
}
