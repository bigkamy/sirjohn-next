import { siteConfig } from "@/lib/site-config";

/** Monogram artwork for the generated favicon and app icon (rendered by ImageResponse). */
export function BrandIconArt({ size, rounded }: { size: number; rounded: boolean }) {
  const { monogram, primaryColor, accentColor } = siteConfig.brand;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: primaryColor,
        color: accentColor,
        borderRadius: rounded ? size * 0.22 : 0,
        fontSize: size * (monogram.length > 1 ? 0.42 : 0.56),
        fontWeight: 800,
        letterSpacing: size * -0.01,
      }}
    >
      {monogram}
    </div>
  );
}
