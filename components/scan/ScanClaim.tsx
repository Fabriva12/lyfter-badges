"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { recordScan } from "@/app/s/[token]/actions";
import ShareButtons from "@/components/share/ShareButtons";
import Spinner from "@/components/ui/Spinner";
import type { ScanFormState } from "@/lib/forms";
import {
  isRetryableScanError,
  nextRetryDelay,
  readPendingScans,
  removePendingScan,
  shouldRetry,
  upsertPendingScan,
  withTimeout,
} from "@/lib/scan/pending";
import { buildShareText } from "@/lib/share";

interface ScanClaimProps {
  token: string;
  userId: string;
  origin: string;
}

type ClaimResult = Extract<
  ScanFormState,
  { status: "collected" | "checked-in" }
>;
type ClaimError = Extract<ScanFormState, { status: "error" }>;

type ClaimState =
  | { phase: "sending" }
  | { phase: "retrying"; attempt: number }
  | { phase: "waiting"; attempt: number }
  | { phase: "done"; result: ClaimResult }
  | { phase: "error"; result: ClaimError };

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

export default function ScanClaim({ token, userId, origin }: ScanClaimProps) {
  const router = useRouter();
  const [state, setState] = useState<ClaimState>({ phase: "sending" });

  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const doneRef = useRef(false);
  const sendingRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendRef = useRef<(attempt: number) => void>(() => {});

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback(
    (attempt: number) => {
      if (doneRef.current) {
        return;
      }

      upsertPendingScan({
        token,
        userId,
        startedAt: startedAtRef.current,
        attempt,
      });

      if (!shouldRetry(attempt)) {
        if (mountedRef.current) {
          setState({ phase: "waiting", attempt });
        }
        return;
      }

      if (mountedRef.current) {
        setState({ phase: "retrying", attempt });
      }

      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;

        // The retry fires outside React's render cycle, so resuming the
        // spinner here is safe (an effect may not set state synchronously).
        if (mountedRef.current) {
          setState({ phase: "sending" });
        }

        sendRef.current(attempt);
      }, nextRetryDelay(attempt));
    },
    [clearTimer, token, userId],
  );

  const send = useCallback(
    async (attempt: number) => {
      if (sendingRef.current || doneRef.current) {
        return;
      }

      sendingRef.current = true;
      clearTimer();

      // The initial render already shows the spinner, and a retry sets it from
      // its own timer. This synchronous path stays state-free, which keeps the
      // kickoff safe for any caller, including an effect.
      upsertPendingScan({
        token,
        userId,
        startedAt: startedAtRef.current,
        attempt,
      });

      try {
        const result = await withTimeout(recordScan(token));

        if (result.status === "collected" || result.status === "checked-in") {
          doneRef.current = true;
          removePendingScan({ token, userId });

          if (mountedRef.current) {
            setState({ phase: "done", result });
          }
          return;
        }

        if (result.status === "error") {
          if (result.reason === "unauthenticated") {
            // Keep the intent queued: once the attendee signs back in, the
            // queue replays it and the badge is not lost.
            router.push(`/login?next=${encodeURIComponent(`/s/${token}`)}`);
            return;
          }

          if (result.retryable) {
            scheduleRetry(attempt + 1);
            return;
          }

          doneRef.current = true;
          removePendingScan({ token, userId });

          if (mountedRef.current) {
            setState({ phase: "error", result });
          }
        }
      } catch (error) {
        if (isRetryableScanError(error)) {
          scheduleRetry(attempt + 1);
          return;
        }

        console.error(error);
        doneRef.current = true;
        removePendingScan({ token, userId });

        if (mountedRef.current) {
          setState({
            phase: "error",
            result: {
              status: "error",
              message: UNEXPECTED_ERROR,
              retryable: true,
              reason: "unexpected",
            },
          });
        }
      } finally {
        sendingRef.current = false;
      }
    },
    [clearTimer, router, scheduleRetry, token, userId],
  );

  useEffect(() => {
    sendRef.current = (attempt) => {
      void send(attempt);
    };
  }, [send]);

  useEffect(() => {
    mountedRef.current = true;

    // Tokens left pending by a previous visit of this attendee are safe to
    // replay: the server is idempotent. Other users on a shared device are
    // ignored. The ref keeps React StrictMode from replaying them twice.
    if (!startedRef.current) {
      startedRef.current = true;

      const pending = readPendingScans().filter(
        (scan) => scan.userId === userId,
      );
      const entry = pending.find((scan) => scan.token === token);
      startedAtRef.current = entry?.startedAt ?? Date.now();

      for (const scan of pending) {
        if (scan.token === token) {
          continue;
        }

        void withTimeout(recordScan(scan.token))
          .then((result) => {
            if (
              result.status === "collected" ||
              result.status === "checked-in" ||
              (result.status === "error" &&
                !result.retryable &&
                result.reason !== "unauthenticated")
            ) {
              removePendingScan(scan);
            }
          })
          .catch(() => {
            // It stays queued for the next visit.
          });
      }
    }

    // Start outside the effect body: `send` updates state, and an effect may
    // not set state synchronously. The timer also makes the StrictMode double
    // run harmless, because the first timer is cleared and `send` itself
    // refuses to overlap requests.
    const kickoff = setTimeout(() => {
      void send(0);
    }, 0);

    return () => {
      mountedRef.current = false;
      clearTimeout(kickoff);
      clearTimer();
    };
  }, [clearTimer, send, token, userId]);

  useEffect(() => {
    const handleOnline = () => {
      if (doneRef.current || sendingRef.current) {
        return;
      }

      clearTimer();

      if (mountedRef.current) {
        setState({ phase: "sending" });
      }

      void send(0);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [clearTimer, send]);

  const retryNow = useCallback(() => {
    if (sendingRef.current) {
      return;
    }

    doneRef.current = false;
    clearTimer();

    if (mountedRef.current) {
      setState({ phase: "sending" });
    }

    void send(0);
  }, [clearTimer, send]);

  const done = state.phase === "done" ? state.result : null;
  const error = state.phase === "error" ? state.result : null;

  return (
    <div className="mt-6 w-full max-w-md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          retryNow();
        }}
        className="rounded-xl border border-[#39424f] bg-[#252c35] p-5 shadow-2xl shadow-black/30 sm:p-7"
      >
        {done?.status === "collected" ? (
          <div
            role="status"
            className="rounded-lg border border-[#a8d889]/40 bg-[#a8d889]/10 px-4 py-4 text-center"
          >
            <p className="text-base font-bold text-[#a8d889]">
              {done.badge.name}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#a8d889]">
              {done.alreadyCollected
                ? `${done.badge.xpAwarded} XP awarded`
                : `+${done.badge.xpAwarded} XP`}
            </p>
            <p className="mt-2 text-sm text-[#d7dce3]">
              Badge collected at {done.eventName}.
            </p>
            {done.levelUp ? (
              <p className="mt-2 text-sm font-bold text-[#36bde9]">
                Level up! You are now {done.levelUp.name}
              </p>
            ) : null}
            {done.alreadyCollected ? (
              <p className="mt-1 text-sm text-[#9ca3af]">
                You already collected this badge.
              </p>
            ) : null}
            <div className="mt-4">
              <ShareButtons
                url={`${origin}/badge/${done.badge.eventBadgeId}`}
                text={buildShareText({
                  badgeName: done.badge.name,
                  eventName: done.eventName,
                  xp: done.badge.xpAwarded,
                })}
                title={done.badge.name}
              />
            </div>
            <Link
              href="/scan"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#394351] px-6 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Scan another QR
            </Link>
          </div>
        ) : null}

        {done?.status === "checked-in" ? (
          <div
            role="status"
            className="rounded-lg border border-[#a8d889]/40 bg-[#a8d889]/10 px-4 py-4 text-center"
          >
            <p className="text-base font-bold text-[#a8d889]">
              You&apos;re checked in at {done.eventName}.
            </p>
            {done.alreadyCheckedIn ? (
              <p className="mt-2 text-sm text-[#9ca3af]">
                You were already checked in.
              </p>
            ) : null}
            <Link
              href="/scan"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#394351] px-6 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Scan a badge QR
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className="space-y-4 text-center">
            <p
              role="alert"
              className="rounded-lg border border-[#f47f8a]/40 bg-[#f47f8a]/10 px-4 py-3 text-sm font-medium text-[#ffb3ba]"
            >
              {error.message}
            </p>
            {error.reason === "unexpected" ? (
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#a8d889] px-6 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
              >
                Try again
              </button>
            ) : null}
            <Link
              href="/scan"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#394351] px-6 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Scan another QR
            </Link>
          </div>
        ) : null}

        {state.phase === "sending" || state.phase === "retrying" ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner
              size="sm"
              label={
                state.phase === "retrying"
                  ? "Retrying your badge"
                  : "Awarding your badge"
              }
            />
            <p
              aria-hidden="true"
              className="text-sm font-semibold text-[#9ca3af]"
            >
              {state.phase === "retrying"
                ? "Could not confirm. Retrying…"
                : "Awarding your badge…"}
            </p>
          </div>
        ) : null}

        {state.phase === "waiting" ? (
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium text-[#ffdca8]">
              We could not confirm this scan. Retrying is safe: a badge is never
              awarded twice.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#a8d889] px-6 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
            >
              Try again
            </button>
            <Link
              href="/scan"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#394351] px-6 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Scan another QR
            </Link>
          </div>
        ) : null}
      </form>
    </div>
  );
}
