import { ImageResponse } from "next/og";

import { BRAND_COLORS, UI_COLORS } from "@/lib/theme/colors";

export const runtime = "nodejs";
export const alt = "Lyfter Badges — collect badges, earn XP, and level up";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: UI_COLORS.background,
          padding: 88,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 6,
            color: BRAND_COLORS.sage,
          }}
        >
          LYFTER BADGES
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 88,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: UI_COLORS.foreground,
          }}
        >
          Collect badges.
          <br />
          Earn XP. Level up.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 32,
            color: UI_COLORS.muted,
          }}
        >
          Scan the QR codes at the talks and stands, and climb the leaderboard
          of every Lyfter event.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            gap: 16,
          }}
        >
          {["Scan", "Collect", "Climb"].map((step) => (
            <div
              key={step}
              style={{
                display: "flex",
                padding: "12px 30px",
                borderRadius: 40,
                backgroundColor: UI_COLORS.surface,
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: UI_COLORS.stroke,
                color: UI_COLORS.subtle,
                fontSize: 28,
              }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
