"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#171b21] px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-[#39424f] bg-[#252c35] p-6 text-center shadow-2xl shadow-black/30 sm:p-8">
        <h1 className="text-lg font-bold text-[#f1f1ed]">
          Something went wrong.
        </h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Retrying is safe: a badge is never awarded twice.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#a8d889] px-6 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
