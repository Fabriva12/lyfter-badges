import { ImageResponse } from "next/og";

import { formatDate } from "@/lib/date";
import { loadPublicEventBadge } from "@/lib/share/collection";
import { BRAND_COLORS, SAGE_TINT_RGBA, UI_COLORS } from "@/lib/theme/colors";

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
        alt: `Insignia ${eventBadge.badge.name} en ${eventBadge.event.name}, que vale ${eventBadge.xpValue} XP`,
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
        backgroundColor: UI_COLORS.background,
        padding: 72,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 72,
          color: UI_COLORS.foreground,
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
          color: UI_COLORS.muted,
        }}
      >
        Recolecta insignias, gana XP y sube de nivel.
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
          backgroundColor: UI_COLORS.background,
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
              color: BRAND_COLORS.sage,
            }}
          >
            LYFTER BADGES
          </div>
          <div style={{ display: "flex", fontSize: 26, color: UI_COLORS.muted }}>
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
              backgroundColor: BRAND_COLORS.sage,
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
              color: UI_COLORS.foreground,
            }}
          >
            {badge.name}
          </div>

          {eventBadge.description ? (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 30,
                lineHeight: 1.3,
                color: UI_COLORS.muted,
              }}
            >
              {eventBadge.description}
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
              backgroundColor: SAGE_TINT_RGBA,
              color: BRAND_COLORS.sage,
              fontSize: 30,
            }}
          >
            +{eventBadge.xpValue} XP
          </div>

          {eventBadge.room ? (
            <div
              style={{
                display: "flex",
                padding: "12px 28px",
                borderRadius: 40,
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: UI_COLORS.stroke,
                color: UI_COLORS.subtle,
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
              color: UI_COLORS.muted,
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
