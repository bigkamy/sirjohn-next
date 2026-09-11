"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { FormAlert, FormField, TextAreaField } from "@/components/auth/form-controls";
import { saveProduct } from "@/lib/admin-product-actions";
import type { AdminProduct } from "@/lib/admin-products";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-images";

const OPTION_SLOTS = 3;
const sectionClass = "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm";

function savedValues(product?: AdminProduct): Record<string, string> {
  if (!product) {
    return { isActive: "on", stock: "0" };
  }
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    price: String(product.price),
    originalPrice: product.originalPrice === null ? "" : String(product.originalPrice),
    badge: product.badge ?? "",
    shortDescription: product.shortDescription,
    description: product.description,
    image: product.image,
    gallery: product.gallery.join("\n"),
    isActive: product.isActive ? "on" : "",
    isSample: product.isSample ? "on" : "",
    ...Object.fromEntries(
      product.options.flatMap((group, slot) => [
        [`optionName${slot}`, group.name],
        [`optionValues${slot}`, group.values.join(", ")],
      ]),
    ),
  };
}

export function ProductForm({ product, categories }: { product?: AdminProduct; categories: string[] }) {
  const [state, formAction, pending] = useActionState(saveProduct, undefined);
  const defaults: Record<string, string | undefined> = { ...savedValues(product), ...state?.values };
  const errors = state?.fieldErrors;
  const categoryError = errors?.category?.[0];

  return (
    <form
      action={formAction}
      // Submitted by hand so React doesn't reset the form after a failed save: a reset would
      // put the category back to its server-rendered placeholder and lose the admin's input.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-6"
    >
      {product && <input type="hidden" name="id" value={product.id} />}

      <section className={sectionClass}>
        <h2 className="mb-5 text-xl font-bold text-slate-900">Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" name="name" required defaultValue={defaults.name} errors={errors?.name} />
          <FormField label="URL slug (blank = from name)" name="slug" placeholder="apex-pro-driver" defaultValue={defaults.slug} errors={errors?.slug} />
          <FormField label="Brand" name="brand" required defaultValue={defaults.brand} errors={errors?.brand} />
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700">Category</label>
            <select
              id="category"
              name="category"
              required
              defaultValue={product?.category ?? ""}
              aria-invalid={Boolean(categoryError)}
              className="w-full rounded-2xl border border-slate-200 bg-[#f7f9f7] px-4 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="" disabled>Choose a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {categoryError && <p className="mt-1.5 text-xs text-red-600">{categoryError}</p>}
          </div>
          <FormField label="Badge (optional)" name="badge" placeholder="New, Sale…" defaultValue={defaults.badge} errors={errors?.badge} />
          <FormField
            className="md:col-span-2"
            label="Short description"
            name="shortDescription"
            defaultValue={defaults.shortDescription}
            errors={errors?.shortDescription}
          />
          <TextAreaField
            className="md:col-span-2"
            label="Description"
            name="description"
            rows={6}
            defaultValue={defaults.description}
            errors={errors?.description}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-5 text-xl font-bold text-slate-900">Pricing and stock</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Price (₹)" name="price" type="number" min={0} step="1" required defaultValue={defaults.price} errors={errors?.price} />
          <FormField
            label="Original price (₹, optional)"
            name="originalPrice"
            type="number"
            min={0}
            step="1"
            defaultValue={defaults.originalPrice}
            errors={errors?.originalPrice}
          />
          {product ? (
            <div>
              <p className="mb-2 block text-sm font-medium text-slate-700">Stock</p>
              <p className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
                {product.stock} — adjust from the products list
              </p>
            </div>
          ) : (
            <FormField label="Starting stock" name="stock" type="number" min={0} step="1" required defaultValue={defaults.stock} errors={errors?.stock} />
          )}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-5 text-xl font-bold text-slate-900">Images</h2>
        <p className="-mt-3 mb-4 text-sm text-slate-600">
          Use a full https:// address, or add the file to <code>public/images</code> and enter its path, e.g.{" "}
          <code>/images/driver.jpg</code>. New products can start with <code>{PRODUCT_PLACEHOLDER_IMAGE}</code> until a photo is ready.
        </p>
        <div className="grid gap-4">
          <FormField label="Main image URL" name="image" inputMode="url" required placeholder="https://… or /images/…" defaultValue={defaults.image} errors={errors?.image} />
          <TextAreaField
            label="Gallery image URLs (one per line, optional)"
            name="gallery"
            rows={4}
            placeholder="https://…"
            defaultValue={defaults.gallery}
            errors={errors?.gallery}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-2 text-xl font-bold text-slate-900">Options</h2>
        <p className="mb-5 text-sm text-slate-600">
          Choices a customer must make before buying, such as Hand Orientation or Shaft Flex. Separate values with commas.
          Leave blank for simple products.
        </p>
        <div className="space-y-4">
          {Array.from({ length: OPTION_SLOTS }, (_, slot) => (
            <div key={slot} className="grid gap-4 md:grid-cols-[1fr_2fr]">
              <FormField
                label={`Option ${slot + 1} name`}
                name={`optionName${slot}`}
                placeholder={slot === 0 ? "Hand Orientation" : undefined}
                defaultValue={defaults[`optionName${slot}`]}
              />
              <FormField
                label={`Option ${slot + 1} values`}
                name={`optionValues${slot}`}
                placeholder={slot === 0 ? "Right Hand, Left Hand" : undefined}
                defaultValue={defaults[`optionValues${slot}`]}
              />
            </div>
          ))}
        </div>
        {errors?.options && <p className="mt-3 text-sm text-red-600">{errors.options[0]}</p>}
        {product && (
          <p className="mt-3 text-xs text-slate-500">
            Past orders keep the options they were bought with. Carts holding a choice you remove will ask the customer to add the item again.
          </p>
        )}
      </section>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isActive" defaultChecked={defaults.isActive === "on"} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
        Show this product in the store
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isSample" defaultChecked={defaults.isSample === "on"} className="h-4 w-4 rounded border-slate-300 text-amber-500" />
        Sample data — label it “Sample” in the store (uncheck once the details and photos are real)
      </label>

      {state?.error && <FormAlert error={state.error} />}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save Product"}
        </button>
        <Link href="/admin/products" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">
          Cancel
        </Link>
      </div>
    </form>
  );
}
