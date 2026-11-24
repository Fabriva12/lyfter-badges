import Link from "next/link";
import type { ReactNode } from "react";

import SignOutButton from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/admin/guards";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-dvh bg-[#171b21] text-[#f1f1ed]">
      <header className="sticky top-0 z-40 border-b border-[#303743] bg-[#1c222a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <Link
            href="/admin"
            aria-label="Ir al panel de administración"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#a8d889] text-sm font-black text-[#243020]">
              {isSuperAdmin ? "S" : "A"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">
                {isSuperAdmin ? "Consola de super admin" : "Consola de admin"}
              </span>
              <span className="hidden truncate text-xs text-[#9ca3af] sm:block">
                {session.user.email}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {isSuperAdmin ? (
              <Link
                href="/super-admin"
                className="text-xs font-semibold text-[#7fd8f5] transition hover:text-[#f1f1ed] sm:text-sm"
              >
                Plataforma
              </Link>
            ) : null}
            <Link
              href="/"
              className="text-xs font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed] sm:text-sm"
            >
              Ver sitio
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
        {children}
      </main>
    </div>
  );
}
