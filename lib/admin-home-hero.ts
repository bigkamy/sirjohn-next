import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { HERO_COLUMNS, toHeroSlide, type HeroSlide } from "@/lib/home-hero";
import { createClient } from "@/lib/supabase/server";

export type AdminHeroSlide = HeroSlide & {
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type AdminHeroRow = Parameters<typeof toHeroSlide>[0] & {
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

/** Every slide, active and inactive, in display order. Needs content.manage. */
export async function listHeroSlides(): Promise<AdminHeroSlide[]> {
  await requirePermission("content.manage", "/admin/homepage");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_hero_slides")
    .select(`${HERO_COLUMNS},sort_order,is_active,updated_at`)
    .order("sort_order")
    .order("id");

  if (error) {
    throw new Error(`Failed to load hero slides: ${error.message}`);
  }

  return (data as AdminHeroRow[]).map((row) => ({
    ...toHeroSlide(row),
    sortOrder: row.sort_order,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  }));
}
