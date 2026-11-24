"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type QrScannerType from "qr-scanner";

import { resolveScanToken } from "@/app/scan/actions";
import Spinner from "@/components/ui/Spinner";
import { parseScanPayload } from "@/lib/qr";

type ScannerState = "idle" | "starting" | "scanning";

interface Feedback {
  tone: "info" | "success" | "error";
  message: string;
}

const FEEDBACK_CLASSES: Record<Feedback["tone"], string> = {
  info: "border-[#36bde9]/40 bg-[#36bde9]/10 text-[#bfe9f8]",
  success: "border-[#a8d889]/40 bg-[#a8d889]/10 text-[#c9eab2]",
  error: "border-[#f47f8a]/40 bg-[#f47f8a]/10 text-[#ffb3ba]",
};

function cameraErrorMessage(error: unknown) {
  const name = error instanceof Error ? error.name : "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera access was blocked. Allow it in your browser settings and try again.";
  }

  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "We could not find a usable camera on this device.";
  }

  if (name === "NotReadableError") {
    return "The camera is already in use by another app. Close it and try again.";
  }

  return "The camera could not start. Check your browser permissions and try again.";
}

export default function QrScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const busyRef = useRef(false);
  const navigatingRef = useRef(false);

  const [state, setState] = useState<ScannerState>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [uploading, setUploading] = useState(false);

  const stopScanner = useCallback(() => {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    setState("idle");
    setTorchAvailable(false);
    setTorchOn(false);
  }, []);

  const handleDecoded = useCallback(
    async (value: string) => {
      if (busyRef.current || navigatingRef.current) {
        return;
      }

      const parsed = parseScanPayload(value);

      if (!parsed) {
        setFeedback({
          tone: "error",
          message: "That QR code is not a Lyfter badge.",
        });
        return;
      }

      busyRef.current = true;
      setFeedback({ tone: "info", message: "Checking QR code…" });

      try {
        const target = await resolveScanToken(parsed.token);

        if (target.status === "welcome" || target.status === "ready") {
          navigatingRef.current = true;
          setFeedback({
            tone: "success",
            message: `Opening ${target.eventName}…`,
          });
          stopScanner();
          router.push(`/s/${target.token}`);
          return;
        }

        if (target.status === "needs_check_in") {
          setFeedback({
            tone: "info",
            message: `First scan the welcome QR for ${target.eventName} at the entrance.`,
          });
        } else if (target.status === "not_started") {
          setFeedback({
            tone: "info",
            message: "This QR code is not available yet.",
          });
        } else if (target.status === "expired") {
          setFeedback({
            tone: "error",
            message: "This QR code has expired.",
          });
        } else {
          setFeedback({
            tone: "error",
            message: "This QR code is not valid or is no longer active.",
          });
        }
      } catch {
        setFeedback({
          tone: "error",
          message:
            "We could not check that QR code. Check your connection and try again.",
        });
      } finally {
        if (!navigatingRef.current) {
          window.setTimeout(() => {
            busyRef.current = false;
          }, 1500);
        }
      }
    },
    [router, stopScanner],
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }

    if (!window.isSecureContext) {
      setCameraError(
        "The camera needs a secure connection. Open this site over HTTPS or on localhost.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access.");
      return;
    }

    setState("starting");
    setCameraError(null);
    setFeedback(null);

    try {
      const { default: QrScannerClass } = await import("qr-scanner");
      const scanner = new QrScannerClass(
        videoRef.current,
        (result) => {
          void handleDecoded(result.data);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 10,
          returnDetailedScanResult: true,
          onDecodeError: () => undefined,
        },
      );

      scannerRef.current = scanner;
      await scanner.start();
      setState("scanning");

      try {
        setTorchAvailable(await scanner.hasFlash());
      } catch {
        setTorchAvailable(false);
      }
    } catch (error) {
      scannerRef.current?.destroy();
      scannerRef.current = null;
      setState("idle");
      setCameraError(cameraErrorMessage(error));
    }
  }, [handleDecoded]);

  const toggleTorch = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      if (torchOn) {
        await scanner.turnFlashOff();
      } else {
        await scanner.turnFlashOn();
      }
      setTorchOn((value) => !value);
    } catch {
      setTorchAvailable(false);
      setTorchOn(false);
    }
  }, [torchOn]);

  const handleFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      setUploading(true);
      setFeedback(null);

      try {
        const { default: QrScannerClass } = await import("qr-scanner");
        const result = await QrScannerClass.scanImage(file, {
          returnDetailedScanResult: true,
          alsoTryWithoutScanRegion: true,
        });
        await handleDecoded(result.data);
      } catch {
        setFeedback({
          tone: "error",
          message: "We could not find a QR code in that image.",
        });
      } finally {
        setUploading(false);
      }
    },
    [handleDecoded],
  );

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-[#39424f] bg-[#252c35] shadow-2xl shadow-black/30">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black sm:aspect-square">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />

          {state !== "scanning" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#171b21] p-6 text-center">
              {state === "starting" ? (
                <>
                  <Spinner size="lg" label="Starting camera" />
                  <p
                    aria-hidden="true"
                    className="text-sm font-semibold text-[#d7dce3]"
                  >
                    Starting camera…
                  </p>
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12 text-[#7fd8f5]"
                  >
                    <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                    <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                    <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                    <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                    <path d="M7 12h10" />
                  </svg>
                  <p className="text-sm text-[#9ca3af]">
                    {cameraError ??
                      "Allow camera access to scan the QR codes."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="min-h-11 rounded-lg bg-[#a8d889] px-6 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
                  >
                    Start camera
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/80" />
          )}
        </div>

        <div className="space-y-3 p-4">
          {state === "scanning" ? (
            <div className="flex gap-2">
              {torchAvailable ? (
                <button
                  type="button"
                  onClick={() => void toggleTorch()}
                  className="min-h-11 flex-1 rounded-lg border border-[#394351] px-4 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
                >
                  {torchOn ? "Torch off" : "Torch on"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={stopScanner}
                className="min-h-11 flex-1 rounded-lg border border-[#394351] px-4 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
              >
                Stop camera
              </button>
            </div>
          ) : null}

          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#394351] px-4 text-sm font-semibold text-[#9ca3af] transition hover:border-[#36bde9] hover:text-[#d7dce3]">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleFile(event)}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? "Reading image…" : "Upload a QR image"}
          </label>
        </div>
      </div>

      {feedback ? (
        <p
          role="status"
          className={`mt-3 rounded-lg border px-4 py-3 text-sm font-medium ${FEEDBACK_CLASSES[feedback.tone]}`}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
