import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import Link from "next/link";

import SignOutButton from "@/components/auth/SignOutButton";
import MobileMenu from "@/components/MobileMenu";
import { getSession } from "@/lib/session";

export default async function Navbar() {
  // Cheap cookie existence check first, the same one `proxy.ts` uses. Only a
  // logged-in visitor pays for the real session read that reveals the role.
  const hasSessionCookie = Boolean(getSessionCookie(await headers()));
  const session = hasSessionCookie ? await getSession() : null;
  const role = session?.user.role;
  const panelEntry =
    role === "ADMIN"
      ? { href: "/admin", label: "Admin" }
      : role === "SUPER_ADMIN"
        ? { href: "/super-admin", label: "Super Admin" }
        : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[#303743] bg-[#171b21]/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6 md:h-20 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Lyfter Badge App — inicio"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#a8d889] font-bold text-[#243020]">
            L
          </div>

          <span className="truncate text-sm font-bold sm:text-base">
            Lyfter Badge App
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-6 text-sm font-medium text-gray-300 md:flex lg:gap-8">
          <Link
            href="/events"
            className="whitespace-nowrap transition hover:text-white"
          >
            Eventos
          </Link>

          <Link
            href="/#como-funciona"
            className="whitespace-nowrap transition hover:text-white"
          >
            Cómo funciona
          </Link>

          <Link
            href="/leaderboard"
            className="whitespace-nowrap transition hover:text-white"
          >
            Leaderboard
          </Link>

          <Link
            href="/collection"
            className="whitespace-nowrap transition hover:text-white"
          >
            Colección
          </Link>

          <Link
            href="/scan"
            className="whitespace-nowrap transition hover:text-white"
          >
            Escanear QR
          </Link>

          {panelEntry ? (
            <Link
              href={panelEntry.href}
              className="whitespace-nowrap transition hover:text-white"
            >
              {panelEntry.label}
            </Link>
          ) : null}

          {session ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-lg border border-[#36bde9] px-5 py-2 text-sm font-semibold transition hover:bg-[#36bde9]/10"
            >
              Login
            </Link>
          )}
        </div>

        <MobileMenu isAuthenticated={Boolean(session)} panelEntry={panelEntry} />
      </nav>
    </header>
  );
}
