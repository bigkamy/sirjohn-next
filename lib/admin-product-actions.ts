"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { logAdminError } from "@/lib/admin/log";
import { requirePermission } from "@/lib/auth/dal";
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
    sku: z
      .string()
      .max(64, { error: "Keep the SKU to 64 characters." })
      .regex(/^([A-Za-z0-9][A-Za-z0-9._-]*)?$/, { error: "Use letters, numbers, dots, dashes, or underscores." }),
    badge: z.string().max(24, { error: "Keep the badge to 24 characters." }),
    price: z.number({ error: "Enter the price." }).min(0).max(10000000),
    salePrice: z.number({ error: "Enter a number or leave blank." }).min(0).max(10000000).nullable(),
    lowStockThreshold: z.number({ error: "Enter a whole number." }).int().min(0).max(100000),
    shortDescription: z.string().max(200),
    description: z.string().max(5000),
    image: imageUrlSchema,
    gallery: z.array(imageUrlSchema).max(8, { error: "Use at most 8 gallery images." }),
    stock: z.number({ error: "Enter the starting stock." }).int().min(0).max(100000),
  })
  .refine((product) => product.salePrice === null || product.salePrice < product.price, {
    error: "The sale price must be lower than the regular price.",
    path: ["salePrice"],
  });

const TEXT_FIELDS = [
  "name",
  "slug",
  "brand",
  "category",
  "sku",
  "badge",
  "price",
  "salePrice",
  "lowStockThreshold",
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
  await requirePermission("catalog.manage", "/admin/products");

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
    sku: values.sku,
    badge: values.badge,
    price: numberOrNaN(values.price),
    salePrice: values.salePrice === "" ? null : numberOrNaN(values.salePrice),
    lowStockThreshold: values.lowStockThreshold === "" ? 5 : numberOrNaN(values.lowStockThreshold),
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
    sku: product.sku || null,
    // On sale: customers pay the sale price and see the regular price struck through.
    price: product.salePrice ?? product.price,
    original_price: product.salePrice === null ? null : product.price,
    badge: product.badge || null,
    low_stock_threshold: product.lowStockThreshold,
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
      const field = error.message.includes("sku") ? "sku" : "slug";
      const message = field === "sku" ? "Another product already uses this SKU." : "Another product already uses this slug.";
      return { error: "Please check the highlighted fields.", fieldErrors: { [field]: [message] }, values };
    }
    if (error.code === "23503") {
      return { error: "Please check the highlighted fields.", fieldErrors: { category: ["Choose a category from the list."] }, values };
    }
    await logAdminError("product.save", "product", id === null ? null : String(id), error.message);
    return { error: "We couldn't save this product. Please try again.", values };
  }
  if (!data) {
    return { error: "This product could not be found.", values };
  }

  invalidateCatalog();
  redirect(`/admin/products?saved=${id === null ? "created" : "updated"}`);
}

/** Adds (positive delta) or removes (negative delta) units relative to the live stock. */
export async function adjustStock(productId: number, delta: number): Promise<AdminResult> {
  await requirePermission("inventory.manage", "/admin/inventory");
  if (!isPositiveInteger(productId) || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100000) {
    return { ok: false, message: "Enter a whole number of units." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_product_stock", { p_product_id: productId, p_delta: delta });
  if (error) {
    if (error.message === "stock_below_zero") return { ok: false, message: "Stock can't go below zero." };
    if (error.message === "product_not_found") return { ok: false, message: "This product no longer exists." };
    await logAdminError("inventory.adjust", "product", String(productId), error.message);
    return { ok: false, message: "We couldn't update stock. Please try again." };
  }

  invalidateCatalog();
  return { ok: true, message: `Stock is now ${data}.`, stock: data as number };
}

export async function setLowStockThreshold(productId: number, threshold: number): Promise<AdminResult> {
  await requirePermission("inventory.manage", "/admin/inventory");
  if (!isPositiveInteger(productId) || !Number.isInteger(threshold) || threshold < 0 || threshold > 100000) {
    return { ok: false, message: "Enter a whole number from 0 to 100,000." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_low_stock_threshold", { p_product_id: productId, p_threshold: threshold });
  if (error) {
    if (error.message === "product_not_found") return { ok: false, message: "This product no longer exists." };
    await logAdminError("inventory.threshold", "product", String(productId), error.message);
    return { ok: false, message: "We couldn't save the threshold. Please try again." };
  }

  invalidateCatalog();
  return { ok: true, message: `Low-stock alert set to ${threshold}.` };
}

/** Hides a product from the store, or shows it again. */
export async function setProductActive(productId: number, active: boolean): Promise<AdminResult> {
  await requirePermission("catalog.manage", "/admin/products");
  if (!isPositiveInteger(productId) || typeof active !== "boolean") {
    return { ok: false, message: "This product could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").update({ is_active: active }).eq("id", productId).select("id").maybeSingle();

  if (error || !data) {
    if (error) await logAdminError("product.visibility", "product", String(productId), error.message);
    return { ok: false, message: "We couldn't update this product. Please try again." };
  }

  invalidateCatalog();
  return { ok: true, message: active ? "Product is visible in the store." : "Product is hidden from the store." };
}

/**
 * Deletes a product. Past orders keep the item's name and price (order_items stores a copy);
 * it disappears from carts, wishlists, and reviews.
 */
export async function deleteProduct(productId: number): Promise<AdminResult> {
  await requirePermission("catalog.manage", "/admin/products");
  if (!isPositiveInteger(productId)) {
    return { ok: false, message: "This product could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").delete().eq("id", productId).select("id,name").maybeSingle();
  if (error || !data) {
    if (error) await logAdminError("product.delete", "product", String(productId), error.message);
    return { ok: false, message: "We couldn't delete this product. Please try again." };
  }

  invalidateCatalog();
  return { ok: true, message: `Deleted “${data.name}”.` };
}

/** Deletes every product flagged as sample data. */
export async function removeSampleProducts(): Promise<AdminResult> {
  await requirePermission("catalog.manage", "/admin/products");

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").delete().eq("is_sample", true).select("id");
  if (error) {
    await logAdminError("product.remove_samples", "product", null, error.message);
    return { ok: false, message: "We couldn't remove the sample products. Please try again." };
  }

  invalidateCatalog();
  const count = data.length;
  return { ok: true, message: count === 1 ? "Removed 1 sample product." : `Removed ${count} sample products.` };
}
