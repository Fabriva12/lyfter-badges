import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SiteChrome from "@/components/SiteChrome";
import { getRequestOrigin } from "@/lib/request";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171b21",
};

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Lyfter Badges",
      template: "%s · Lyfter Badges",
    },
    description: "Collect badges, earn XP, and level up at Lyfter events.",
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
