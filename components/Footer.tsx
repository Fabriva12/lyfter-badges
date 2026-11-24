import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-col gap-5 bg-[#282f3a] px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
      {/* Logo */}
      <Link
        href="/"
        aria-label="Lyfter Badge App — inicio"
        className="flex items-center gap-3"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#a8d889] text-xs font-bold text-[#243020]">
          L
        </div>

        <span className="text-sm font-semibold">Lyfter Badge App</span>
      </Link>

      {/* Links */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#89919e]">
        <a href="#" className="transition hover:text-white">
          Términos
        </a>

        <a href="#" className="transition hover:text-white">
          Privacidad
        </a>
        <a href="#" className="transition hover:text-white">
          Contacto
        </a>
      </div>
      {/* Copyright */}
      <span className="font-mono text-xs text-[#6e7683]">© 2026 Lyfter</span>
    </footer>
  );
}



