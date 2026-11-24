import { ImageResponse } from "next/og";

import { formatDate } from "@/lib/date";
import { loadPublicEventBadge } from "@/lib/share/collection";

export const runtime = "nodejs";
export const alt = "Lyfter Badges";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageParams {
  params: Promise<{ eventBadgeId: string }>;
}

/**
 * The alt text of the image is part of the social preview, so it has to
 * describe the badge. `generateImageMetadata` is the only hook that lets a
 * dynamic `alt` reach the generated `og:image` tag.
 */
export async function generateImageMetadata({ params }: ImageParams) {
  const { eventBadgeId } = await params;

  try {
    const eventBadge = await loadPublicEventBadge(eventBadgeId);

    if (!eventBadge) {
      return [{ id: "fallback", alt: "Lyfter Badges", size, contentType }];
    }

    return [
      {
        id: eventBadgeId,
        alt: `${eventBadge.badge.name} badge at ${eventBadge.event.name}, worth ${eventBadge.badge.xpValue} XP`,
        size,
        contentType,
      },
    ];
  } catch {
    return [{ id: "fallback", alt: "Lyfter Badges", size, contentType }];
  }
}

function FallbackCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#171b21",
        padding: 72,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 72,
          color: "#f1f1ed",
          letterSpacing: -1,
        }}
      >
        Lyfter Badges
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 24,
          fontSize: 32,
          color: "#9ca3af",
        }}
      >
        Collect badges, earn XP, and level up.
      </div>
    </div>
  );
}

export default async function Image({ params }: ImageParams) {
  const { eventBadgeId } = await params;

  const eventBadge = await loadPublicEventBadge(eventBadgeId);

  if (!eventBadge) {
    return new ImageResponse(<FallbackCard />, { ...size });
  }

  const { badge, event } = eventBadge;
  const eventDate = formatDate(event.startsAt);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#171b21",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 5,
              color: "#a8d889",
            }}
          >
            LYFTER BADGES
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#89919e" }}>
            {event.name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 128,
              height: 128,
              borderRadius: 32,
              backgroundColor: "#a8d889",
              color: "#263021",
              fontSize: 64,
            }}
          >
            {badge.name.charAt(0).toUpperCase()}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 36,
              fontSize: 66,
              lineHeight: 1.1,
              color: "#f1f1ed",
            }}
          >
            {badge.name}
          </div>

          {badge.description ? (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 30,
                lineHeight: 1.3,
                color: "#9ca3af",
              }}
            >
              {badge.description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "12px 28px",
              borderRadius: 40,
              backgroundColor: "rgba(168, 216, 137, 0.15)",
              color: "#a8d889",
              fontSize: 30,
            }}
          >
            +{badge.xpValue} XP
          </div>

          {eventBadge.room ? (
            <div
              style={{
                display: "flex",
                padding: "12px 28px",
                borderRadius: 40,
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: "#394351",
                color: "#d7dce3",
                fontSize: 30,
              }}
            >
              {eventBadge.room}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 28,
              color: "#89919e",
            }}
          >
            {eventDate}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
