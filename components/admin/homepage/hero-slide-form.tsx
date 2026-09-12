"use client";

import { ImageIcon, Pencil, Plus } from "lucide-react";
import { useActionState, useId, useRef, useState } from "react";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { Checkbox, Field, FormError, TextArea } from "@/components/admin/ui/fields";
import { buttonClass, inputClass, labelClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import type { AdminHeroSlide } from "@/lib/admin-home-hero";
import { saveHeroSlide } from "@/lib/admin-home-hero-actions";
import type { FormState } from "@/lib/form-state";
import { NETWORK_ERROR } from "@/lib/messages";

/** The size a hero image is designed for; anything wider is cropped to fit, never stretched. */
export const RECOMMENDED_HERO_SIZE = "1920 × 800 pixels";

/** A landscape image field: preview, the shared media library picker, and a URL you can paste. */
function HeroImageField({ defaultValue, error, id }: { defaultValue: string; error?: string; id: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>Image</label>
      <div className="mb-3 flex aspect-[12/5] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={28} aria-hidden />}
      </div>
      <input
        id={id}
        name="imageUrl"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        inputMode="url"
        placeholder="https://… or /images/…"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className={inputClass}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <MediaPicker canUpload onSelect={setValue} label={value ? "Replace image" : "Choose from library"} />
        {value && (
          <button type="button" onClick={() => setValue("")} className={buttonClass("ghost", "sm")}>
            Remove image
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          Landscape works best — around {RECOMMENDED_HERO_SIZE}. JPG, PNG, WebP, AVIF or GIF up to 5 MB.
        </p>
      )}
    </div>
  );
}

type Props = { slide?: AdminHeroSlide; disabled?: boolean };

/** Adds a slide, or edits one when `slide` is given. Opens in a dialog over the list. */
export function HeroSlideForm({ slide, disabled }: Props) {
  const editing = slide !== undefined;
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const toast = useToast();
  // Remounting after a successful add clears every field, the image preview included.
  const [formKey, setFormKey] = useState(0);

  const [state, formAction, pending] = useActionState(async (previous: FormState, formData: FormData): Promise<FormState> => {
    const result = await saveHeroSlide(previous, formData).catch(() => ({ error: NETWORK_ERROR }) as FormState);
    if (result?.message) {
      toast({ message: result.message });
      dialog.current?.close();
      if (!editing) setFormKey((key) => key + 1);
    } else if (result?.error && !result.fieldErrors) {
      toast({ tone: "error", message: result.error });
    }
    return result;
  }, undefined);

  const errors = state?.fieldErrors;
  const values = {
    imageUrl: slide?.imageUrl ?? "",
    imageAlt: slide?.imageAlt ?? "",
    title: slide?.title ?? "",
    subtitle: slide?.subtitle ?? "",
    buttonText: slide?.buttonText ?? "Know More",
    buttonUrl: slide?.buttonUrl ?? "/shop",
    ...state?.values,
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => dialog.current?.showModal()}
        aria-label={editing ? `Edit slide ${slide.sortOrder}` : undefined}
        className={editing ? buttonClass("secondary", "sm") : buttonClass("primary")}
      >
        {editing ? <><Pencil size={13} aria-hidden /> Edit</> : <><Plus size={16} aria-hidden /> Add Hero Slide</>}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(40rem,calc(100%-2rem))] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
        onClick={(event) => {
          if (event.target === dialog.current && !pending) dialog.current.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold">{editing ? `Edit slide ${slide.sortOrder}` : "Add a hero slide"}</h2>
        </div>

        <form key={formKey} action={formAction} className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {editing && <input type="hidden" name="id" value={slide.id} />}

          <HeroImageField id={`${fieldId}-image`} defaultValue={values.imageUrl} error={errors?.imageUrl?.[0]} />

          <Field
            id={`${fieldId}-alt`}
            label="Image alt text"
            name="imageAlt"
            maxLength={160}
            defaultValue={values.imageAlt}
            errors={errors?.imageAlt}
            hint="Describes the picture for screen readers and when an image fails to load. Leave empty only if the image is purely decorative."
          />

          <Field
            id={`${fieldId}-title`}
            label="Heading"
            name="title"
            required
            maxLength={80}
            defaultValue={values.title}
            errors={errors?.title}
            hint="Up to 80 characters. The first slide's heading is the page's main heading."
          />

          <TextArea
            id={`${fieldId}-subtitle`}
            label="Description (optional)"
            name="subtitle"
            rows={3}
            maxLength={200}
            defaultValue={values.subtitle}
            errors={errors?.subtitle}
            hint="Up to 200 characters."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${fieldId}-button-text`} label="Button text" name="buttonText" required maxLength={30} defaultValue={values.buttonText} errors={errors?.buttonText} />
            <Field
              id={`${fieldId}-button-url`}
              label="Button link"
              name="buttonUrl"
              required
              defaultValue={values.buttonUrl}
              errors={errors?.buttonUrl}
              hint="A path on this site such as /shop, or a full https:// address. External links open in a new tab."
            />
          </div>

          <Checkbox
            name="isActive"
            label="Show this slide on the home page"
            description="Hidden slides stay here but never appear publicly. They still count towards the six."
            defaultChecked={slide?.isActive ?? true}
          />

          <FormError message={state?.fieldErrors ? state.error : undefined} />

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" disabled={pending} onClick={() => dialog.current?.close()} className={buttonClass("secondary")}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? "Saving…" : editing ? "Save slide" : "Add slide"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
