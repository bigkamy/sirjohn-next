"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import * as z from "zod";
import { logAdminError, logAdminEvent } from "@/lib/admin/log";
import { requirePermission } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import { HERO_CACHE_TAG, MAX_HERO_SLIDES } from "@/lib/home-hero";
import { createClient } from "@/lib/supabase/server";
import { formText, imageUrlSchema, isPositiveInteger, linkUrlSchema } from "@/lib/validation";

type Result = { ok: boolean; message: string };

const FULL_MESSAGE = `You can have a maximum of ${MAX_HERO_SLIDES} hero slides. Delete an existing slide before adding another.`;

const slideSchema = z.object({
  imageUrl: imageUrlSchema,
  imageAlt: z.string().max(160, { error: "Keep the alt text under 160 characters." }),
  title: z.string().min(1, { error: "Enter a heading." }).max(80, { error: "Keep the heading under 80 characters." }),
  subtitle: z.string().max(200, { error: "Keep the description under 200 characters." }),
  buttonText: z.string().min(1, { error: "Enter the button text." }).max(30, { error: "Keep the button text under 30 characters." }),
  buttonUrl: linkUrlSchema,
});

/** The home page and every prerendered page that embeds the hero. */
function invalidateHero() {
  revalidateTag(HERO_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

const shorten = (text: string) => (text.length > 40 ? `${text.slice(0, 40)}…` : text);

/** Adds a hero slide, or with an id, edits it. New slides go last and are counted by the database. */
export async function saveHeroSlide(_state: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("content.manage", "/admin/homepage");

  const idText = formText(formData, "id");
  const id = idText ? Number(idText) : null;
  if (id !== null && !isPositiveInteger(id)) {
    return { error: "This slide could not be found." };
  }

  const values = {
    imageUrl: formText(formData, "imageUrl"),
    imageAlt: formText(formData, "imageAlt"),
    title: formText(formData, "title"),
    subtitle: formText(formData, "subtitle"),
    buttonText: formText(formData, "buttonText"),
    buttonUrl: formText(formData, "buttonUrl"),
  };
  const isActive = formData.get("isActive") === "on";

  if (!values.imageUrl) {
    return { error: "Please check the highlighted fields.", fieldErrors: { imageUrl: ["Choose or upload an image."] }, values };
  }

  const parsed = slideSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const row = {
    image_url: parsed.data.imageUrl,
    image_alt: parsed.data.imageAlt,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    button_text: parsed.data.buttonText,
    button_url: parsed.data.buttonUrl,
    is_active: isActive,
  };

  const supabase = await createClient();
  const { data, error } =
    id === null
      ? await supabase.from("home_hero_slides").insert(row).select("id,sort_order").single()
      : await supabase.from("home_hero_slides").update(row).eq("id", id).select("id,sort_order").maybeSingle();

  if (error) {
    if (error.message.includes("too_many_slides")) {
      return { error: FULL_MESSAGE, values };
    }
    await logAdminError("hero.save", "hero_slide", id === null ? null : String(id), error.message);
    return { error: "We couldn't save this slide. Please try again.", values };
  }
  if (!data) {
    return { error: "This slide could not be found.", values };
  }

  await logAdminEvent(
    id === null ? "hero.created" : "hero.updated",
    "hero_slide",
    String(data.id),
    `${id === null ? "Added" : "Edited"} hero slide ${data.sort_order}: ${shorten(parsed.data.title)}`,
  );
  invalidateHero();

  // A successful add returns no values, so the form clears itself for the next one.
  return id === null ? { message: "Hero slide added." } : { message: "Hero slide saved.", values };
}

export async function deleteHeroSlide(id: number): Promise<Result> {
  await requirePermission("content.manage", "/admin/homepage");
  if (!isPositiveInteger(id)) {
    return { ok: false, message: "This slide could not be found." };
  }

  const supabase = await createClient();
  // The image itself stays in the media library: it may be used somewhere else too.
  const { data, error } = await supabase.from("home_hero_slides").delete().eq("id", id).select("id,title").maybeSingle();

  if (error || !data) {
    if (error) await logAdminError("hero.delete", "hero_slide", String(id), error.message);
    return { ok: false, message: "We couldn't delete this slide. Please try again." };
  }

  await logAdminEvent("hero.deleted", "hero_slide", String(id), `Deleted hero slide: ${shorten(data.title)}`);
  invalidateHero();
  return { ok: true, message: "Hero slide deleted. The image is still in your media library." };
}

export async function setHeroSlideActive(id: number, active: boolean): Promise<Result> {
  await requirePermission("content.manage", "/admin/homepage");
  if (!isPositiveInteger(id) || typeof active !== "boolean") {
    return { ok: false, message: "This slide could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_hero_slides")
    .update({ is_active: active })
    .eq("id", id)
    .select("id,title")
    .maybeSingle();

  if (error || !data) {
    if (error) await logAdminError("hero.visibility", "hero_slide", String(id), error.message);
    return { ok: false, message: "We couldn't update this slide. Please try again." };
  }

  await logAdminEvent(
    active ? "hero.activated" : "hero.deactivated",
    "hero_slide",
    String(id),
    `${active ? "Showed" : "Hid"} hero slide: ${shorten(data.title)}`,
  );
  invalidateHero();
  return { ok: true, message: active ? "Slide is now showing on the home page." : "Slide is hidden from the home page." };
}

/**
 * Moves one slide up or down. The whole order is sent to reorder_home_hero_slides, which
 * rewrites it 1..n in a single statement, so two positions can never clash.
 */
export async function moveHeroSlide(id: number, direction: "up" | "down"): Promise<Result> {
  await requirePermission("content.manage", "/admin/homepage");
  if (!isPositiveInteger(id) || (direction !== "up" && direction !== "down")) {
    return { ok: false, message: "That move isn't valid." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("home_hero_slides").select("id").order("sort_order").order("id");
  if (error) {
    await logAdminError("hero.reorder", "hero_slide", String(id), error.message);
    return { ok: false, message: "We couldn't reorder the slides. Please try again." };
  }

  const ids = (data as { id: number }[]).map((row) => row.id);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) {
    return { ok: false, message: "This slide is already at the end of the list." };
  }
  [ids[from], ids[to]] = [ids[to], ids[from]];

  const { error: reorderError } = await supabase.rpc("reorder_home_hero_slides", { p_ids: ids });
  if (reorderError) {
    if (reorderError.message === "not_authorized") {
      return { ok: false, message: "Your role can't reorder hero slides." };
    }
    await logAdminError("hero.reorder", "hero_slide", String(id), reorderError.message);
    return { ok: false, message: "We couldn't reorder the slides. Please try again." };
  }

  await logAdminEvent("hero.reordered", "hero_slide", String(id), `Moved hero slide ${from + 1} to position ${to + 1}`);
  invalidateHero();
  return { ok: true, message: `Moved to position ${to + 1}.` };
}
