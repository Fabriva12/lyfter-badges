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
  /** Legacy tokens are listed for reference only: never expose their secret. */
  showQr?: boolean;
}

export default async function TokenCard({
  token,
  eventId,
  origin,
  label,
  canToggle = true,
  showQr = true,
}: TokenCardProps) {
  const scanUrl = `${origin}/s/${token.token}`;
  const qr = showQr ? await qrDataUrl(scanUrl) : null;

  return (
    <div className="rounded-lg border border-stroke bg-surface-low p-4">
      <div className="flex flex-wrap items-start gap-4">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt={`Código QR de ${label}`}
            width={120}
            height={120}
            className="h-24 w-24 shrink-0 rounded bg-white p-1 sm:h-[120px] sm:w-[120px]"
          />
        ) : null}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                token.active
                  ? "bg-sage/15 text-sage-soft"
                  : "bg-coral/15 text-coral-soft"
              }`}
            >
              {token.active ? "Activo" : "Inactivo"}
            </span>

            <span className="text-xs text-muted">
              {token.scans} {token.scans === 1 ? "escaneo" : "escaneos"} ·{" "}
              {token.maxScans === null
                ? "sin límite"
                : `límite ${token.maxScans}`}
            </span>
          </div>

          {showQr ? (
            <Link
              href={`/s/${token.token}`}
              target="_blank"
              className="block break-all font-mono text-xs text-celeste-soft hover:underline"
            >
              {scanUrl}
            </Link>
          ) : null}

          <div className="flex flex-wrap items-start gap-2">
            {showQr ? <CopyButton value={scanUrl} /> : null}
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
