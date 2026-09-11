"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import type { ProductOptionGroup } from "@/lib/product-options";
import { invalidateCatalog } from "@/lib/revalidate-catalog";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { formText, imageUrlSchema, isPositiveInteger, numberOrNaN } from "@/lib/validation";

type AdminResult = { ok: boolean; message: string; stock?: number };

/** How many option groups (e.g. Hand Orientation, Shaft Flex) the form offers. */
const OPTION_SLOTS = 3;

const productSchema = z
  .object({
    name: z.string().min(2, { error: "Enter the product name." }).max(120),
    slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use lowercase letters, numbers, and single hyphens." }),
    brand: z.string().min(1, { error: "Enter the brand." }).max(60),
    category: z.string().min(1, { error: "Choose a category." }),
    price: z.number({ error: "Enter a price." }).min(0).max(10000000),
    originalPrice: z.number({ error: "Enter a number or leave blank." }).min(0).max(10000000).nullable(),
    badge: z.string().max(24, { error: "Keep the badge to 24 characters." }),
    shortDescription: z.string().max(200),
    description: z.string().max(5000),
    image: imageUrlSchema,
    gallery: z.array(imageUrlSchema).max(8, { error: "Use at most 8 gallery images." }),
    stock: z.number({ error: "Enter the starting stock." }).int().min(0).max(100000),
  })
  .refine((product) => product.originalPrice === null || product.originalPrice >= product.price, {
    error: "The original price must be at least the selling price.",
    path: ["originalPrice"],
  });

const TEXT_FIELDS = [
  "name",
  "slug",
  "brand",
  "category",
  "price",
  "originalPrice",
  "badge",
  "shortDescription",
  "description",
  "image",
  "gallery",
  "stock",
  ...Array.from({ length: OPTION_SLOTS }, (_, slot) => [`optionName${slot}`, `optionValues${slot}`]).flat(),
];

// Each slot is a name ("Shaft Flex") plus comma-separated values ("Regular, Stiff").
function readOptionGroups(formData: FormData): { groups: ProductOptionGroup[]; error?: string } {
  const groups: ProductOptionGroup[] = [];
  for (let slot = 0; slot < OPTION_SLOTS; slot++) {
    const name = formText(formData, `optionName${slot}`);
    const values = [
      ...new Set(
        formText(formData, `optionValues${slot}`)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    if (!name && values.length === 0) continue;
    if (!name || values.length === 0) {
      return { groups, error: "Give each option a name and at least one value." };
    }
    if (name.length > 40 || values.length > 20 || values.some((value) => value.length > 40)) {
      return { groups, error: "Option names and values must be 40 characters or fewer, with at most 20 values." };
    }
    if (groups.some((group) => group.name.toLowerCase() === name.toLowerCase())) {
      return { groups, error: "Each option needs a different name." };
    }
    groups.push({ name, values });
  }
  return { groups };
}

export async function saveProduct(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/products");

  const idText = formText(formData, "id");
  const id = idText ? Number(idText) : null;
  if (id !== null && !isPositiveInteger(id)) {
    return { error: "This product could not be found." };
  }

  const values: Record<string, string> = Object.fromEntries(TEXT_FIELDS.map((key) => [key, formText(formData, key)]));
  values.isActive = formData.get("isActive") === "on" ? "on" : "";
  values.isSample = formData.get("isSample") === "on" ? "on" : "";

  const parsed = productSchema.safeParse({
    name: values.name,
    slug: values.slug || slugify(values.name),
    brand: values.brand,
    category: values.category,
    price: numberOrNaN(values.price),
    originalPrice: values.originalPrice === "" ? null : numberOrNaN(values.originalPrice),
    badge: values.badge,
    shortDescription: values.shortDescription,
    description: values.description,
    image: values.image,
    gallery: values.gallery
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    // Stock is only set when creating; afterwards it changes through adjustStock.
    stock: id === null ? numberOrNaN(values.stock) : 0,
  });
  const options = readOptionGroups(formData);

  if (!parsed.success || options.error) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: {
        ...(parsed.success ? {} : z.flattenError(parsed.error).fieldErrors),
        ...(options.error ? { options: [options.error] } : {}),
      },
      values,
    };
  }

  const product = parsed.data;
  const row = {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    price: product.price,
    original_price: product.originalPrice,
    badge: product.badge || null,
    short_description: product.shortDescription,
    description: product.description,
    image: product.image,
    gallery: product.gallery,
    options: options.groups,
    is_active: values.isActive === "on",
    is_sample: values.isSample === "on",
  };

  const supabase = await createClient();
  const { data, error } =
    id === null
      ? await supabase.from("products").insert({ ...row, stock: product.stock }).select("id").single()
      : await supabase.from("products").update(row).eq("id", id).select("id").maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { error: "Please check the highlighted fields.", fieldErrors: { slug: ["Another product already uses this slug."] }, values };
    }
    if (error.code === "23503") {
      return { error: "Please check the highlighted fields.", fieldErrors: { category: ["Choose a category from the list."] }, values };
    }
    console.error("Saving product failed:", error.message);
    return { error: "We couldn't save this product. Please try again.", values };
  }
  if (!data) {
    return { error: "This product could not be found.", values };
  }

  invalidateCatalog();
  redirect("/admin/products?saved=1");
}

/** Adds (positive delta) or removes (negative delta) units relative to the live stock. */
export async function adjustStock(productId: number, delta: number): Promise<AdminResult> {
  await requireAdmin("/admin/products");
  if (!isPositiveInteger(productId) || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100000) {
    return { ok: false, message: "Enter a whole number of units." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_product_stock", { p_product_id: productId, p_delta: delta });
  if (error) {
    if (error.message === "stock_below_zero") return { ok: false, message: "Stock can't go below zero." };
    if (error.message === "product_not_found") return { ok: false, message: "This product no longer exists." };
    console.error("Stock adjustment failed:", error.message);
    return { ok: false, message: "We couldn't update stock. Please try again." };
  }

  invalidateCatalog();
  return { ok: true, message: `Stock is now ${data}.`, stock: data as number };
}

/** Hides a product from the store (or shows it again). Real products are hidden rather than
 * deleted, so past orders keep their links. */
export async function setProductActive(productId: number, active: boolean): Promise<AdminResult> {
  await requireAdmin("/admin/products");
  if (!isPositiveInteger(productId) || typeof active !== "boolean") {
    return { ok: false, message: "This product could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: active })
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Product visibility update failed:", error.message);
    return { ok: false, message: "We couldn't update this product. Please try again." };
  }

  invalidateCatalog();
  return { ok: true, message: active ? "Product is visible in the store." : "Product is hidden from the store." };
}

/**
 * Deletes every product flagged as sample data. Past orders keep their item names and prices
 * (order_items stores a copy); sample items disappear from carts and wishlists.
 */
export async function removeSampleProducts(): Promise<AdminResult> {
  await requireAdmin("/admin/products");

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").delete().eq("is_sample", true).select("id");
  if (error) {
    console.error("Removing sample products failed:", error.message);
    return { ok: false, message: "We couldn't remove the sample products. Please try again." };
  }

  invalidateCatalog();
  const count = data.length;
  return { ok: true, message: count === 1 ? "Removed 1 sample product." : `Removed ${count} sample products.` };
}
