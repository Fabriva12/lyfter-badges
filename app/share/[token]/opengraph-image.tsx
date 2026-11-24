import { ImageResponse } from "next/og";

import {
  loadShareCollection,
  type ShareCollection,
} from "@/lib/share/collection";
import { BRAND_COLORS, SAGE_TINT_RGBA, UI_COLORS } from "@/lib/theme/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Lyfter Badges collection";
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

interface ImageParams {
  params: Promise<{ token: string }>;
}

export async function generateImageMetadata({ params }: ImageParams) {
  const { token } = await params;
  const collection = await loadShareCollection(token);

  if (!collection) {
    return [{ id: "fallback", alt: "Lyfter Badges", size, contentType }];
  }

  return [
    {
      id: "collection",
      alt: `${collection.attendeeName}'s ${collection.eventName} badge collection`,
      size,
      contentType,
    },
  ];
}

const typeColors: Record<string, { background: string; foreground: string }> = {
  WELCOME: { background: BRAND_COLORS.sage, foreground: "#263021" },
  TALK: { background: BRAND_COLORS.celeste, foreground: "#10232d" },
  STAND: { background: BRAND_COLORS.lilac, foreground: "#2b1630" },
  SPECIAL: { background: "#f2c14e", foreground: "#2e2410" },
};

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function badgeWord(total: number) {
  return total === 1 ? "badge" : "badges";
}

function FallbackCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: UI_COLORS.background,
        padding: 64,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: UI_COLORS.stroke,
          backgroundColor: UI_COLORS.surface,
          padding: 48,
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
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 56,
            color: UI_COLORS.foreground,
          }}
        >
          Collection not available
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 28,
            color: UI_COLORS.muted,
          }}
        >
          Scan. Collect. Level up.
        </div>
      </div>
    </div>
  );
}

function BadgeTile({ name, type }: { name: string; type: string }) {
  const colors = typeColors[type] ?? {
    background: UI_COLORS.stroke,
    foreground: UI_COLORS.foreground,
  };

  return (
    <div
      style={{
        width: 140,
        height: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 32,
        backgroundColor: colors.background,
        color: colors.foreground,
        fontSize: 58,
        fontWeight: 700,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CollectionCard({ collection }: { collection: ShareCollection }) {
  const hasMore = collection.badges.length > 6;
  const visibleBadges = collection.badges.slice(0, hasMore ? 5 : 6);
  const remaining = collection.badges.length - visibleBadges.length;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: UI_COLORS.background,
        padding: 32,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 40,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: UI_COLORS.stroke,
          backgroundColor: UI_COLORS.surface,
          padding: 32,
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
          <div style={{ display: "flex", fontSize: 24, color: UI_COLORS.muted }}>
            {truncate(collection.eventDate, 28)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 60,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: UI_COLORS.muted }}>
            {truncate(collection.eventName, 42)}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 68,
              lineHeight: 1.05,
              color: UI_COLORS.foreground,
            }}
          >
            {truncate(collection.attendeeName, 24)}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 28,
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
              {collection.collected} / {collection.total}{" "}
              {badgeWord(collection.total)}
            </div>
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
              {collection.xp} XP
            </div>
          </div>
        </div>

        {collection.badges.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              marginTop: 52,
            }}
          >
            {visibleBadges.map((badge, index) => (
              <BadgeTile
                key={`${badge.name}-${index}`}
                name={badge.name}
                type={badge.type}
              />
            ))}
            {remaining > 0 ? (
              <div
                style={{
                  width: 140,
                  height: 140,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 32,
                  borderWidth: 2,
                  borderStyle: "solid",
                  borderColor: UI_COLORS.stroke,
                  color: UI_COLORS.muted,
                  fontSize: 32,
                }}
              >
                +{remaining}
              </div>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              marginTop: 52,
              fontSize: 30,
              color: UI_COLORS.muted,
            }}
          >
            No badges collected yet.
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, color: UI_COLORS.muted }}>
            Lyfter Badges
          </div>
          <div style={{ display: "flex", fontSize: 24, color: BRAND_COLORS.sage }}>
            Scan. Collect. Level up.
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Image({ params }: ImageParams) {
  const { token } = await params;
  const collection = await loadShareCollection(token);

  if (!collection) {
    return new ImageResponse(<FallbackCard />, { ...size });
  }

  return new ImageResponse(<CollectionCard collection={collection} />, {
    ...size,
  });
}
