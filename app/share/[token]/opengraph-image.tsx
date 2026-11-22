import { ImageResponse } from "next/og";

import {
  loadShareCollection,
  type ShareCollection,
} from "@/lib/share/collection";

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
  WELCOME: { background: "#a8d889", foreground: "#263021" },
  TALK: { background: "#36bde9", foreground: "#10232d" },
  STAND: { background: "#d77bdb", foreground: "#2b1630" },
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
        backgroundColor: "#171b21",
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
          borderColor: "#39424f",
          backgroundColor: "#252c35",
          padding: 48,
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
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 56,
            color: "#f1f1ed",
          }}
        >
          Collection not available
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 28,
            color: "#9ca3af",
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
    background: "#39424f",
    foreground: "#f1f1ed",
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
        backgroundColor: "#171b21",
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
          borderColor: "#39424f",
          backgroundColor: "#252c35",
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
              color: "#a8d889",
            }}
          >
            LYFTER BADGES
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#89919e" }}>
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
          <div style={{ display: "flex", fontSize: 30, color: "#9ca3af" }}>
            {truncate(collection.eventName, 42)}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 68,
              lineHeight: 1.05,
              color: "#f1f1ed",
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
                backgroundColor: "rgba(168, 216, 137, 0.15)",
                color: "#a8d889",
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
                borderColor: "#394351",
                color: "#d7dce3",
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
                  borderColor: "#394351",
                  color: "#9ca3af",
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
              color: "#9ca3af",
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
          <div style={{ display: "flex", fontSize: 24, color: "#89919e" }}>
            Lyfter Badges
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#a8d889" }}>
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
