// Server-only QR rendering. The token URL is the physical secret printed on
// the wall, so the image is generated on demand and never stored.
import QRCode from "qrcode";

export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 240,
    color: { dark: "#171b21", light: "#ffffff" },
  });
}
