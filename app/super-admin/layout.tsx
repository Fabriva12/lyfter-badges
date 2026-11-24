import Link from "next/link";
import type { ReactNode } from "react";

import SuperAdminTabs from "@/components/admin/super-admin/SuperAdminTabs";
import SignOutButton from "@/components/auth/SignOutButton";
import { requireSuperAdmin } from "@/lib/admin/guards";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSuperAdmin();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-stroke bg-[#1c222a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <Link
            href="/super-admin"
            aria-label="Ir al resumen de super admin"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-celeste text-sm font-black text-[#10222b]">
              S
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-bold">
                  Lyfter · Super admin
                </span>
                <span className="hidden rounded-full border border-celeste/40 bg-celeste/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-celeste-soft sm:inline">
                  Super admin
                </span>
              </span>
              <span className="hidden truncate text-xs text-muted sm:block">
                {session.user.email}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-muted transition hover:text-foreground sm:text-sm"
            >
              Ver sitio
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
          <SuperAdminTabs />
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        {children}
      </main>
    </div>
  );
}
