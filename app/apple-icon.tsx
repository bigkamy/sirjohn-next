import { ImageResponse } from "next/og";
import { BrandIconArt } from "@/components/brand/brand-icon-art";

// Home-screen icon for iPhone and iPad, generated from siteConfig.brand.
// To use your own: add a 180×180 app/apple-icon.png and delete this file.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // iOS rounds the corners itself.
  return new ImageResponse(<BrandIconArt size={size.width} rounded={false} />, size);
}
