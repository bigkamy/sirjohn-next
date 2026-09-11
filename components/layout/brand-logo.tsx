import { Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

/** Header/footer logo: the image in siteConfig.brand.logoSrc if set, otherwise the text wordmark. */
export function BrandLogo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { brand, name } = siteConfig;

  if (brand.logoSrc) {
    return <img src={brand.logoSrc} alt={name} className="h-11 w-auto" />;
  }

  const light = tone === "light";
  return (
    <span className="flex items-center gap-3">
      <span
        className={
          light
            ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-emerald-400 shadow-md"
            : "flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400"
        }
      >
        {light ? <Sparkles size={18} /> : brand.monogram.charAt(0)}
      </span>
      <span>
        <span className={`block text-lg font-black ${light ? "tracking-[0.30em] text-slate-900" : "tracking-[0.24em] text-white"}`}>
          {brand.wordmark}
        </span>
        <span className={`block text-[10px] uppercase tracking-[0.38em] ${light ? "text-slate-500" : "text-slate-400"}`}>{brand.tagline}</span>
      </span>
    </span>
  );
}
