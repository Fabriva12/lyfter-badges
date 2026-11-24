"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { buildShareUrls } from "@/lib/share";

interface ShareButtonsProps {
  url: string;
  text: string;
  title?: string;
  imageUrl?: string;
}

// The native share sheet only exists on some mobile browsers. Reading it
// through `useSyncExternalStore` keeps the server render deterministic and
// avoids setting state inside an effect, which would cascade a second render.
function subscribeToNavigatorShare() {
  return () => {};
}

function getNavigatorShare() {
  return typeof navigator !== "undefined" && "share" in navigator;
}

function getServerShare() {
  return false;
}

const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]";

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-[#a8d889] px-4 py-2 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a]";

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.585 0 11.946-5.36 11.949-11.945a11.9 11.9 0 0 0-3.421-8.4" />
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

function ShareIcon() {
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
      <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
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

export default function ShareButtons({
  url,
  text,
  title,
  imageUrl,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const canShare = useSyncExternalStore(
    subscribeToNavigatorShare,
    getNavigatorShare,
    getServerShare,
  );

  const targets = buildShareUrls({ url, text });

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  async function handleNativeShare() {
    try {
      await navigator.share({ title: title ?? text, text, url });
    } catch {
      // The attendee dismissed the share sheet. Nothing to report.
    }
  }

  async function handleCopy() {
    setCopyFailed(false);

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        return;
      } catch {
        // Clipboard access was denied. Fall through to the manual copy path.
      }
    }

    setCopyFailed(true);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {canShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className={primaryButton}
            aria-label="Share this badge"
          >
            <ShareIcon />
            Share
          </button>
        ) : null}

        <a
          href={targets.x}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButton}
          aria-label="Share on X"
        >
          <XIcon />
          X
        </a>

        <a
          href={targets.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButton}
          aria-label="Share on WhatsApp"
        >
          <WhatsAppIcon />
          WhatsApp
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

        {imageUrl ? (
          <a
            href={imageUrl}
            download="lyfter-badge.png"
            className={secondaryButton}
            aria-label="Download the badge image"
          >
            <DownloadIcon />
            Download
          </a>
        ) : null}

        <button
          type="button"
          onClick={handleCopy}
          className={secondaryButton}
          aria-label="Copy the link to this badge"
        >
          <CopyIcon />
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      {copyFailed ? (
        <div className="w-full">
          <label
            htmlFor="share-url-fallback"
            className="block text-xs font-semibold uppercase tracking-widest text-[#9ca3af]"
          >
            Copy this link
          </label>
          <input
            id="share-url-fallback"
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 w-full rounded-lg border border-[#394351] bg-[#1f252d] px-3 py-2 text-sm text-[#d7dce3]"
          />
        </div>
      ) : null}

      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard" : ""}
      </span>
    </div>
  );
}
