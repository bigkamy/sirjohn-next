"use client";

import { useActionState, useState, useTransition } from "react";
import { FormAlert, FormField } from "@/components/auth/form-controls";
import { deleteCategory, saveCategory } from "@/lib/admin-category-actions";
import type { AdminCategory } from "@/lib/admin-categories";
import { NETWORK_ERROR } from "@/lib/messages";

const buttonClass = "rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60";

export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(saveCategory, undefined);

  return (
    <form action={formAction} aria-label="Add category" className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-slate-900">Add a category</h2>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr_3fr]">
        <FormField id="new-category-name" label="Name" name="name" required defaultValue={state?.values?.name} errors={state?.fieldErrors?.name} />
        <FormField
          id="new-category-order"
          label="Display order"
          name="sortOrder"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={state?.values?.sortOrder ?? "100"}
          errors={state?.fieldErrors?.sortOrder}
        />
        <FormField
          id="new-category-image"
          label="Image URL (optional)"
          name="image"
          inputMode="url"
          placeholder="https://… or /images/…"
          defaultValue={state?.values?.image}
          errors={state?.fieldErrors?.image}
        />
      </div>
      <div className="mt-5">
        <FormAlert error={state?.error} message={state?.message} />
      </div>
      <button type="submit" disabled={pending} className={`${buttonClass} mt-5 bg-[#0f172a] text-white`}>
        {pending ? "Adding…" : "Add Category"}
      </button>
    </form>
  );
}

export function CategoryRow({ category }: { category: AdminCategory }) {
  const [state, formAction, pending] = useActionState(saveCategory, undefined);
  const [deleting, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const defaults = { name: category.name, sortOrder: String(category.sortOrder), image: category.image ?? "", ...state?.values };
  // Several rows share the page, so field ids are prefixed with the category id.
  const idFor = (field: string) => `category-${category.id}-${field}`;
  const inUse = category.productCount > 0;

  const remove = () => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) {
      return;
    }
    startTransition(async () => {
      setDeleteError(null);
      const result = await deleteCategory(category.id).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      if (!result.ok) setDeleteError(result.message);
    });
  };

  return (
    <form action={formAction} aria-label={`${category.name} category`} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="id" value={category.id} />
      <div className="grid gap-4 md:grid-cols-[2fr_1fr_3fr]">
        <FormField id={idFor("name")} label="Name" name="name" required defaultValue={defaults.name} errors={state?.fieldErrors?.name} />
        <FormField
          id={idFor("order")}
          label="Display order"
          name="sortOrder"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={defaults.sortOrder}
          errors={state?.fieldErrors?.sortOrder}
        />
        <FormField
          id={idFor("image")}
          label="Image URL (optional)"
          name="image"
          inputMode="url"
          placeholder="https://… or /images/…"
          defaultValue={defaults.image}
          errors={state?.fieldErrors?.image}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">
          {category.productCount} {category.productCount === 1 ? "product" : "products"}
        </span>
        <button type="submit" disabled={pending} className={`${buttonClass} bg-[#0f172a] text-white`}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={deleting || inUse}
          onClick={remove}
          aria-label={`Delete ${category.name}`}
          title={inUse ? "Move this category's products to another category first" : undefined}
          className={`${buttonClass} border border-red-200 bg-white text-red-600 hover:bg-red-50`}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        {inUse && <span className="text-xs text-slate-500">Categories with products can&apos;t be deleted.</span>}
      </div>

      {(state?.error || state?.message || deleteError) && (
        <div className="mt-4">
          <FormAlert error={deleteError ?? state?.error} message={state?.message} />
        </div>
      )}
    </form>
  );
}
