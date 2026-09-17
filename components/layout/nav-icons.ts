import {
  Backpack,
  CircleDot,
  CupSoda,
  Flag,
  Footprints,
  Gift,
  HeartPulse,
  House,
  Info,
  Mail,
  Shirt,
  Store,
  Tag,
  Trophy,
  Umbrella,
  Watch,
  type LucideIcon,
} from "lucide-react";

/**
 * The icon shown before each menu label, in the header nav and in the mobile panel. Imported
 * by both rather than passed down, because an icon component can't cross the server/client
 * boundary as a prop.
 *
 * Category names come from /admin/categories, so a category that isn't listed here — a new
 * one, or a renamed one — falls back to a neutral tag rather than breaking the menu.
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  Home: House,
  Shop: Store,
  "About Us": Info,
  Contact: Mail,
  // Categories, as named in 20260919000000_sir_john_catalog.sql.
  Clubs: Flag,
  Bags: Backpack,
  Balls: CircleDot,
  Apparel: Shirt,
  Footwear: Footprints,
  Accessories: Watch,
  "Course Essentials": Umbrella,
  Drinkware: CupSoda,
  Wellness: HeartPulse,
  "Gifts & Trophies": Trophy,
  Gifts: Gift,
};

export const navIcon = (label: string): LucideIcon => NAV_ICONS[label] ?? Tag;
