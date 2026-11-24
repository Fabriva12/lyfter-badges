import Link from "next/link";

import CopyButton from "@/components/admin/CopyButton";
import TokenToggle from "@/components/admin/TokenToggle";
import type { AdminToken } from "@/lib/admin/queries";
import { qrDataUrl } from "@/lib/admin/qr";

interface TokenCardProps {
  token: AdminToken;
  eventId?: string;
  origin: string;
  label: string;
  canToggle?: boolean;
}

export default async function TokenCard({
  token,
  eventId,
  origin,
  label,
  canToggle = true,
}: TokenCardProps) {
  const scanUrl = `${origin}/s/${token.token}`;
  const qr = await qrDataUrl(scanUrl);

  return (
    <div className="rounded-lg border border-[#39424f] bg-[#1f252d] p-4">
      <div className="flex flex-wrap items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={`Código QR de ${label}`}
          width={120}
          height={120}
          className="h-24 w-24 shrink-0 rounded bg-white p-1 sm:h-[120px] sm:w-[120px]"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                token.active
                  ? "bg-[#a8d889]/15 text-[#b8e39a]"
                  : "bg-[#f47f8a]/15 text-[#ffb3ba]"
              }`}
            >
              {token.active ? "Activo" : "Inactivo"}
            </span>

            <span className="text-xs text-[#9ca3af]">
              {token.scans} {token.scans === 1 ? "escaneo" : "escaneos"} ·{" "}
              {token.maxScans === null
                ? "sin límite"
                : `límite ${token.maxScans}`}
            </span>
          </div>

          <Link
            href={`/s/${token.token}`}
            target="_blank"
            className="block break-all font-mono text-xs text-[#7fd8f5] hover:underline"
          >
            {scanUrl}
          </Link>

          <div className="flex flex-wrap items-start gap-2">
            <CopyButton value={scanUrl} />
            {canToggle && eventId ? (
              <TokenToggle
                eventId={eventId}
                tokenId={token.id}
                active={token.active}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
