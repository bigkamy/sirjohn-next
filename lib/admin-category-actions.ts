"use server";

import * as z from "zod";
import { logAdminError } from "@/lib/admin/log";
import { requirePermission } from "@/lib/auth/dal";
import type { FormState } from "@/lib/form-state";
import { invalidateCatalog } from "@/lib/revalidate-catalog";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { formText, imageUrlSchema, isPositiveInteger, numberOrNaN } from "@/lib/validation";

const categorySchema = z.object({
  name: z.string().min(2, { error: "Enter a category name." }).max(60),
  slug: z
    .string()
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use lowercase letters, numbers, and single hyphens." }),
  sortOrder: z.number({ error: "Enter a whole number." }).int().min(0).max(9999),
  image: z.union([z.literal(""), imageUrlSchema]),
});

/** Adds a category, or with an id, edits it. Renaming updates its products too
 * (products.category references categories.name with ON UPDATE CASCADE). */
export async function saveCategory(_state: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("catalog.manage", "/admin/categories");

  const idText = formText(formData, "id");
  const id = idText ? Number(idText) : null;
  if (id !== null && !isPositiveInteger(id)) {
    return { error: "This category could not be found." };
  }

  const values = {
    name: formText(formData, "name"),
    slug: formText(formData, "slug"),
    sortOrder: formText(formData, "sortOrder"),
    image: formText(formData, "image"),
  };
  const parsed = categorySchema.safeParse({
    ...values,
    slug: values.slug || slugify(values.name),
    sortOrder: numberOrNaN(values.sortOrder),
  });
  if (!parsed.success) {
    return { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const row = { name: parsed.data.name, slug: parsed.data.slug, sort_order: parsed.data.sortOrder, image: parsed.data.image || null };
  const supabase = await createClient();
  const { data, error } =
    id === null
      ? await supabase.from("categories").insert(row).select("id").single()
      : await supabase.from("categories").update(row).eq("id", id).select("id").maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const field = error.message.includes("slug") ? "slug" : "name";
      return {
        error: "Please check the highlighted fields.",
        fieldErrors: { [field]: [field === "slug" ? "Another category already uses this slug." : "A category with this name already exists."] },
        values,
      };
    }
    await logAdminError("category.save", "category", id === null ? null : String(id), error.message);
    return { error: "We couldn't save this category. Please try again.", values };
  }
  if (!data) {
    return { error: "This category could not be found.", values };
  }

  invalidateCatalog();
  // A successful add returns no values, so the add form clears itself.
  return id === null ? { message: `${parsed.data.name} added.` } : { message: `${parsed.data.name} saved.`, values };
}

export async function deleteCategory(id: number): Promise<{ ok: boolean; message: string }> {
  await requirePermission("catalog.manage", "/admin/categories");
  if (!isPositiveInteger(id)) {
    return { ok: false, message: "This category could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").delete().eq("id", id).select("id,name").maybeSingle();

  if (error?.code === "23503") {
    return { ok: false, message: "Move this category's products to another category first." };
  }
  if (error || !data) {
    if (error) await logAdminError("category.delete", "category", String(id), error.message);
    return { ok: false, message: "We couldn't delete this category. Please try again." };
  }

  invalidateCatalog();
  return { ok: true, message: `Deleted the ${data.name} category.` };
}
