import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.brand.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: siteConfig.brand.primaryColor,
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
