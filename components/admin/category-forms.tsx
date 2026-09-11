"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { ImageField } from "@/components/admin/products/image-fields";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { Field, FormError } from "@/components/admin/ui/fields";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { deleteCategory, saveCategory } from "@/lib/admin-category-actions";
import type { AdminCategory } from "@/lib/admin-categories";
import type { FormState } from "@/lib/form-state";
import { NETWORK_ERROR } from "@/lib/messages";

/** Runs saveCategory and announces the outcome as a toast; field errors stay beside the fields. */
function useCategoryAction(onSaved?: () => void) {
  const toast = useToast();
  return useActionState(async (previous: FormState, formData: FormData): Promise<FormState> => {
    const result = await saveCategory(previous, formData).catch(() => ({ error: NETWORK_ERROR }) as FormState);
    if (result?.message) {
      toast({ message: result.message });
      onSaved?.();
    } else if (result?.error && !result.fieldErrors) {
      toast({ tone: "error", message: result.error });
    }
    return result;
  }, undefined);
}

function CategoryFields({ prefix, defaults, state }: { prefix: string; defaults: Record<string, string>; state: FormState }) {
  const errors = state?.fieldErrors;
  const values = { ...defaults, ...state?.values };
  return (
    <div className="grid gap-4">
      <Field id={`${prefix}-name`} label="Name" name="name" required defaultValue={values.name} errors={errors?.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${prefix}-slug`} label="Slug" name="slug" defaultValue={values.slug} errors={errors?.slug} hint="Blank = from the name." />
        <Field id={`${prefix}-order`} label="Display order" name="sortOrder" type="number" min={0} step="1" required defaultValue={values.sortOrder} errors={errors?.sortOrder} />
      </div>
      <ImageField id={`${prefix}-image`} name="image" label="Home page image (optional)" canUpload defaultValue={values.image} errors={errors?.image} />
    </div>
  );
}

export function AddCategoryForm() {
  // Remounting the form after a save clears every field, including the image preview.
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useCategoryAction(() => setFormKey((key) => key + 1));

  return (
    <form key={formKey} action={formAction} aria-label="Add category" className="space-y-4 p-5">
      <CategoryFields prefix="new-category" defaults={{ name: "", slug: "", sortOrder: "100", image: "" }} state={state} />
      {state?.fieldErrors && <FormError message={state.error} />}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Adding…" : "Add Category"}
      </button>
    </form>
  );
}

export function CategoryRow({ category, canManage }: { category: AdminCategory; canManage: boolean }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useCategoryAction(() => setEditing(false));
  const inUse = category.productCount > 0;
  const prefix = `category-${category.id}`;

  return (
    <li aria-label={`${category.name} category`} className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-[#0f172a] to-emerald-700">
          {category.image && <img src={category.image} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{category.name}</p>
          <p className="text-xs text-slate-500">
            /{category.slug} · order {category.sortOrder} · {category.productCount} {category.productCount === 1 ? "product" : "products"}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              aria-expanded={editing}
              aria-label={`Edit ${category.name}`}
              onClick={() => setEditing((value) => !value)}
              className={buttonClass("secondary", "sm")}
            >
              <Pencil size={13} aria-hidden /> {editing ? "Close" : "Edit"}
            </button>
            <ConfirmButton
              label={<Trash2 size={14} aria-hidden />}
              ariaLabel={`Delete ${category.name}`}
              disabled={inUse}
              title={`Delete the ${category.name} category?`}
              description="It disappears from the shop filters, menu, and home page."
              confirmLabel="Delete category"
              onConfirm={async () => {
                const result = await deleteCategory(category.id).catch(() => ({ ok: false, message: NETWORK_ERROR }));
                toast({ tone: result.ok ? "success" : "error", message: result.message });
              }}
            />
          </div>
        )}
      </div>
      {canManage && inUse && !editing && <p className="mt-2 text-xs text-slate-500">Categories with products can&apos;t be deleted.</p>}

      {editing && (
        <form action={formAction} aria-label={`Edit ${category.name}`} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <input type="hidden" name="id" value={category.id} />
          <CategoryFields
            prefix={prefix}
            defaults={{ name: category.name, slug: category.slug, sortOrder: String(category.sortOrder), image: category.image ?? "" }}
            state={state}
          />
          {state?.fieldErrors && <FormError message={state.error} />}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={buttonClass("ghost", "sm")}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
