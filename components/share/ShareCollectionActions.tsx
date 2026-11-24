"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { buildShareUrls } from "@/lib/share";

interface ShareCollectionActionsProps {
  url: string;
  text: string;
  imageUrl: string;
  title: string;
}

const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]";

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-[#a8d889] px-4 py-2 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a] disabled:cursor-not-allowed disabled:opacity-60";

function subscribeToNavigatorShare() {
  return () => {};
}

function getCanShareFiles() {
  if (typeof navigator === "undefined" || !navigator.canShare) {
    return false;
  }

  try {
    const file = new File([], "image.png", { type: "image/png" });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function getServerShare() {
  return false;
}

function LinkedInIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

type Status = "idle" | "copied" | "copy-failed" | "image-error";

export default function ShareCollectionActions({
  url,
  text,
  imageUrl,
  title,
}: ShareCollectionActionsProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [busy, setBusy] = useState(false);

  const canShareFiles = useSyncExternalStore(
    subscribeToNavigatorShare,
    getCanShareFiles,
    getServerShare,
  );

  const targets = buildShareUrls({ url, text });
  const caption = `${text}\n\n${url}`;

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timer = setTimeout(() => setStatus("idle"), 2500);

    return () => clearTimeout(timer);
  }, [status]);

  async function handleShareImage() {
    setBusy(true);
    setStatus("idle");

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        setStatus("image-error");
        return;
      }

      const blob = await response.blob();
      const file = new File([blob], "lyfter-collection.png", {
        type: "image/png",
      });

      if (!navigator.canShare?.({ files: [file] })) {
        setStatus("image-error");
        return;
      }

      await navigator.share({ files: [file], text, url, title });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStatus("image-error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(caption);
      setStatus("copied");
    } catch {
      setStatus("copy-failed");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={targets.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButton}
          aria-label="Share on LinkedIn"
        >
          <LinkedInIcon />
          LinkedIn
        </a>

        <a
          href={targets.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButton}
          aria-label="Share on Facebook"
        >
          <FacebookIcon />
          Facebook
        </a>

        {canShareFiles ? (
          <button
            type="button"
            onClick={handleShareImage}
            disabled={busy}
            className={primaryButton}
            aria-label="Share the collection image on Instagram"
          >
            <InstagramIcon />
            {busy ? "Preparing..." : "Instagram"}
          </button>
        ) : null}

        <a
          href={imageUrl}
          download="lyfter-collection.png"
          className={secondaryButton}
          aria-label="Download the collection image"
        >
          <DownloadIcon />
          Download
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className={secondaryButton}
          aria-label="Copy the collection caption"
        >
          <CopyIcon />
          {status === "copied" ? "Copied" : "Copy caption"}
        </button>
      </div>

      {status === "image-error" ? (
        <p className="text-center text-sm text-[#f0a5a5]">
          Could not prepare the image. Use Download and post it manually.
        </p>
      ) : null}

      {status === "copy-failed" ? (
        <div className="w-full">
          <label
            htmlFor="collection-caption"
            className="block text-xs font-semibold uppercase tracking-widest text-[#9ca3af]"
          >
            Copy this caption
          </label>
          <textarea
            id="collection-caption"
            readOnly
            rows={4}
            value={caption}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 w-full rounded-lg border border-[#394351] bg-[#1f252d] px-3 py-2 text-sm text-[#d7dce3]"
          />
        </div>
      ) : null}

      <span role="status" aria-live="polite" className="sr-only">
        {status === "copied" ? "Caption copied to the clipboard" : ""}
      </span>
    </div>
  );
}
