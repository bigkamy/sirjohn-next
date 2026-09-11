"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { GalleryField, ImageField } from "@/components/admin/products/image-fields";
import { Card, CardHeader } from "@/components/admin/ui/primitives";
import { Checkbox, Field, FormError, Select, TextArea } from "@/components/admin/ui/fields";
import { buttonClass } from "@/components/admin/ui/styles";
import { saveProduct } from "@/lib/admin-product-actions";
import type { AdminProduct } from "@/lib/admin-products";

const OPTION_SLOTS = 3;

function savedValues(product?: AdminProduct): Record<string, string> {
  if (!product) {
    return { isActive: "on", stock: "0", lowStockThreshold: "5" };
  }
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    sku: product.sku ?? "",
    badge: product.badge ?? "",
    price: String(product.regularPrice),
    salePrice: product.salePrice === null ? "" : String(product.salePrice),
    lowStockThreshold: String(product.lowStockThreshold),
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
      <FormError message={state?.error} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Field label="Name" name="name" required defaultValue={defaults.name} errors={errors?.name} className="md:col-span-2" />
              <Field label="Brand" name="brand" required defaultValue={defaults.brand} errors={errors?.brand} />
              <Select label="Category" name="category" required defaultValue={defaults.category ?? ""} errors={errors?.category}>
                <option value="" disabled>Choose a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
              <Field label="SKU (optional)" name="sku" defaultValue={defaults.sku} errors={errors?.sku} placeholder="e.g. DRV-APEX-10" hint="Your stock-keeping code. Must be unique." />
              <Field
                label="URL slug"
                name="slug"
                defaultValue={defaults.slug}
                errors={errors?.slug}
                placeholder="apex-pro-driver"
                hint="Leave blank to create it from the name."
              />
              <Field label="Badge (optional)" name="badge" defaultValue={defaults.badge} errors={errors?.badge} placeholder="New, Sale…" />
            </div>
          </Card>

          <Card>
            <CardHeader title="Description" />
            <div className="grid gap-4 p-5">
              <Field label="Short description" name="shortDescription" defaultValue={defaults.shortDescription} errors={errors?.shortDescription} hint="One line shown on the product page, under the price." />
              <TextArea label="Description" name="description" rows={7} defaultValue={defaults.description} errors={errors?.description} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Images" />
            <div className="grid gap-5 p-5">
              <ImageField name="image" label="Main image" required canUpload allowPlaceholder defaultValue={defaults.image} errors={errors?.image} />
              <GalleryField canUpload defaultValue={defaults.gallery} errors={errors?.gallery} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Options"
              description="Choices a customer must make before buying, such as Hand Orientation or Shaft Flex. Separate values with commas; leave blank for simple products."
            />
            <div className="space-y-4 p-5">
              {Array.from({ length: OPTION_SLOTS }, (_, slot) => (
                <div key={slot} className="grid gap-4 md:grid-cols-[1fr_2fr]">
                  <Field
                    label={`Option ${slot + 1} name`}
                    name={`optionName${slot}`}
                    placeholder={slot === 0 ? "Hand Orientation" : undefined}
                    defaultValue={defaults[`optionName${slot}`]}
                  />
                  <Field
                    label={`Option ${slot + 1} values`}
                    name={`optionValues${slot}`}
                    placeholder={slot === 0 ? "Right Hand, Left Hand" : undefined}
                    defaultValue={defaults[`optionValues${slot}`]}
                  />
                </div>
              ))}
              {errors?.options && <p className="text-sm text-red-600">{errors.options[0]}</p>}
              {product && (
                <p className="text-xs text-slate-500">
                  Past orders keep the options they were bought with. Carts holding a choice you remove will ask the customer to add the item again.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Pricing" />
            <div className="grid gap-4 p-5">
              <Field label="Price (₹)" name="price" type="number" min={0} step="1" required defaultValue={defaults.price} errors={errors?.price} />
              <Field
                label="Sale price (₹, optional)"
                name="salePrice"
                type="number"
                min={0}
                step="1"
                defaultValue={defaults.salePrice}
                errors={errors?.salePrice}
                hint="While set, customers pay this and see the regular price struck through."
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Inventory" />
            <div className="grid gap-4 p-5">
              {product ? (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Stock</p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                    {product.stock} in stock ·{" "}
                    <Link href={`/admin/inventory?q=${encodeURIComponent(product.name)}`} className="font-medium text-emerald-700">
                      adjust in Inventory
                    </Link>
                  </p>
                </div>
              ) : (
                <Field label="Starting stock" name="stock" type="number" min={0} step="1" required defaultValue={defaults.stock} errors={errors?.stock} />
              )}
              <Field
                label="Low-stock alert at"
                name="lowStockThreshold"
                type="number"
                min={0}
                step="1"
                defaultValue={defaults.lowStockThreshold}
                errors={errors?.lowStockThreshold}
                hint="The product is flagged as low stock at or below this many units."
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Visibility" />
            <div className="space-y-4 p-5">
              <Checkbox name="isActive" label="Visible in the store" description="Hidden products can't be found or bought." defaultChecked={defaults.isActive === "on"} />
              <Checkbox
                name="isSample"
                label="Sample data"
                description="Labelled “Sample” in the store. Uncheck once the details and photos are real."
                defaultChecked={defaults.isSample === "on"}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Sticks to the bottom of the screen while the form is in view, so Save is always reachable. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/admin/products" className={buttonClass("secondary")}>
            Cancel
          </Link>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "Saving…" : product ? "Save Product" : "Create Product"}
          </button>
        </div>
      </div>
    </form>
  );
}
