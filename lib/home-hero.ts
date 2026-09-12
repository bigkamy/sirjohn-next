import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/** Cache tag for the home page hero; admin edits revalidate it. */
export const HERO_CACHE_TAG = "home-hero";

/** At most six slides, counting inactive ones. The database enforces it too. */
export const MAX_HERO_SLIDES = 6;

export type HeroSlide = {
  id: number;
  imageUrl: string;
  imageAlt: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
};

export const HERO_COLUMNS = "id,image_url,image_alt,title,subtitle,button_text,button_url";

type HeroRow = {
  id: number;
  image_url: string;
  image_alt: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_url: string;
};

export const toHeroSlide = (row: HeroRow): HeroSlide => ({
  id: row.id,
  imageUrl: row.image_url,
  imageAlt: row.image_alt,
  title: row.title,
  subtitle: row.subtitle,
  buttonText: row.button_text,
  buttonUrl: row.button_url,
});

/**
 * Active hero slides in their saved order, for the home page. Empty when none are active or
 * Supabase isn't configured, and the page then falls back to its built-in hero.
 */
export const getActiveHeroSlides = unstable_cache(
  async (): Promise<HeroSlide[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await createPublicClient()
      .from("home_hero_slides")
      .select(HERO_COLUMNS)
      .eq("is_active", true)
      .order("sort_order")
      .order("id")
      .limit(MAX_HERO_SLIDES);

    if (error) {
      // The home page still renders: it shows the built-in hero instead.
      console.error("Failed to load hero slides:", error.message);
      return [];
    }
    return (data as HeroRow[]).map(toHeroSlide);
  },
  ["home-hero-slides"],
  { tags: [HERO_CACHE_TAG], revalidate: 300 },
);
