"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const CONSOLE_PREFIXES = ["/admin", "/super-admin"] as const;

function isConsolePath(pathname: string) {
  return CONSOLE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

interface SiteChromeProps {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export default function SiteChrome({
  navbar,
  footer,
  children,
}: SiteChromeProps) {
  const pathname = usePathname();

  if (isConsolePath(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      {navbar}
      {children}
      {footer}
    </>
  );
}
