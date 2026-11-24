"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SignOutButton from "@/components/auth/SignOutButton";

interface PanelEntry {
  href: string;
  label: string;
}

interface MobileMenuProps {
  isAuthenticated: boolean;
  panelEntry: PanelEntry | null;
}

const LINKS = [
  { href: "/events", label: "Eventos" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/collection", label: "Colección" },
  { href: "/scan", label: "Escanear QR" },
];

export default function MobileMenu({
  isAuthenticated,
  panelEntry,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#39424f] text-[#f1f1ed] transition hover:bg-[#272d36]"
      >
        {open ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[#303743] bg-[#171b21] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-black/40"
        >
          <nav aria-label="Navegación principal" className="flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-lg px-3 text-base font-semibold text-[#d7dce3] transition hover:bg-[#272d36] hover:text-[#f1f1ed]"
              >
                {link.label}
              </Link>
            ))}

            {panelEntry ? (
              <Link
                href={panelEntry.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-lg px-3 text-base font-semibold text-[#d7dce3] transition hover:bg-[#272d36] hover:text-[#f1f1ed]"
              >
                {panelEntry.label}
              </Link>
            ) : null}
          </nav>

          <div className="mt-3 border-t border-[#303743] pt-4">
            {isAuthenticated ? (
              <div className="px-3" onClick={() => setOpen(false)}>
                <SignOutButton />
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-lg border border-[#36bde9] px-5 text-sm font-semibold text-[#7fd8f5] transition hover:bg-[#36bde9]/10"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
