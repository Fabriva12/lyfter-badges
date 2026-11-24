import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SiteChrome from "@/components/SiteChrome";
import { getRequestOrigin } from "@/lib/request";
import { UI_COLORS } from "@/lib/theme/colors";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: UI_COLORS.background,
};

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Lyfter Badges",
      template: "%s · Lyfter Badges",
    },
    description: "Recolecta insignias, gana XP y sube de nivel en los eventos de Lyfter.",
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SiteChrome navbar={<Navbar />} footer={<Footer />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
