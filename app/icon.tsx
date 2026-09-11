import { ImageResponse } from "next/og";
import { BrandIconArt } from "@/components/brand/brand-icon-art";

// Browser favicon, generated from siteConfig.brand until a real icon exists.
// To use your own: add app/icon.png (or app/icon.svg) and delete this file.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIconArt size={size.width} rounded />, size);
}
