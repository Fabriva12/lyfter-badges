"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "overview", label: "Resumen", path: "/super-admin" },
  { key: "companies", label: "Empresas", path: "/super-admin/companies" },
  { key: "events", label: "Eventos", path: "/super-admin/events" },
  { key: "users", label: "Usuarios", path: "/super-admin/users" },
  { key: "metrics", label: "Métricas", path: "/super-admin/metrics" },
  { key: "audit", label: "Auditoría", path: "/super-admin/audit" },
] as const;

export default function SuperAdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de super admin"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.path === "/super-admin"
            ? pathname === "/super-admin"
            : pathname.startsWith(tab.path);

        return (
          <Link
            key={tab.key}
            href={tab.path}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[#36bde9]/15 text-[#7fd8f5]"
                : "text-[#9ca3af] hover:bg-[#272d36] hover:text-[#f1f1ed]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
