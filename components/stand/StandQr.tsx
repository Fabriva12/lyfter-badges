"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { rotateStandQr } from "@/app/stand/[eventBadgeId]/actions";
import { primaryButtonClassName } from "@/components/admin/formStyles";
import { ROTATION_POLL_MS } from "@/lib/stand/rotation";
import { UI_COLORS } from "@/lib/theme/colors";

// Keep in sync with the server-side renderer in lib/admin/qr.ts.
const QR_OPTIONS = {
  margin: 1,
  width: 240,
  color: { dark: UI_COLORS.background, light: "#ffffff" },
};

interface StandQrInitial {
  token: string;
  expiresAt: string;
  startsAt: string;
  qr: string;
}

interface StandQrProps {
  eventBadgeId: string;
  initial: StandQrInitial;
  label?: string;
  note?: string;
}

export default function StandQr({
  eventBadgeId,
  initial,
  label = "QR del stand",
  note,
}: StandQrProps) {
  const [current, setCurrent] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inFlight = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setBusy(true);

    try {
      const next = await rotateStandQr(eventBadgeId, force);
      const scanUrl = `${window.location.origin}/s/${next.token}`;
      const qr = await QRCode.toDataURL(scanUrl, QR_OPTIONS);

      setCurrent({
        token: next.token,
        expiresAt: next.expiresAt,
        startsAt: next.startsAt,
        qr,
      });
      setError(null);
    } catch {
      // Keep the last QR on screen: a failed poll must not blank the kiosk.
      setError(
        "No se pudo actualizar el código QR. Se reintentará automáticamente; también puedes rotarlo ahora.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [eventBadgeId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, ROTATION_POLL_MS);

    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const update = () => {
      const remaining = Math.ceil(
        (Date.parse(current.expiresAt) - Date.now()) / 1000,
      );

      setSecondsLeft(Math.max(0, remaining));
    };

    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, [current.expiresAt]);

  return (
    <div className="rounded-xl border border-stroke bg-surface p-5 text-center shadow-2xl shadow-black/30 sm:p-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.qr}
        alt={`Código QR para ${label}`}
        width={240}
        height={240}
        className="mx-auto h-56 w-56 rounded bg-white p-2 sm:h-64 sm:w-64"
      />

      <p className="mt-5 text-sm text-muted">
        Vence en{" "}
        <span className="font-mono text-lg font-bold text-foreground">
          {secondsLeft}s
        </span>
      </p>

      {secondsLeft === 0 ? (
        <p className="mt-2 text-xs text-[#f6c86a]">
          {error ? "Falló la actualización; reintentando." : "Actualizando…"}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-coral-soft">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void refresh(true)}
        disabled={busy}
        className={`${primaryButtonClassName} mt-5 w-full sm:w-auto`}
      >
        {busy ? "Rotando…" : "Rotar ahora"}
      </button>

      {note ? (
        <p className="mt-5 text-xs leading-relaxed text-muted">{note}</p>
      ) : null}
    </div>
  );
}
