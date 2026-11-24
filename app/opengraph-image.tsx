import { ImageResponse } from "next/og";

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
          backgroundColor: "#171b21",
          padding: 88,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 6,
            color: "#a8d889",
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
            color: "#f1f1ed",
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
            color: "#9ca3af",
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
                backgroundColor: "#252c35",
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: "#394351",
                color: "#d7dce3",
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
