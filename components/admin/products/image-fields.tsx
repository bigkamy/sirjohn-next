"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { buttonClass, inputClass, labelClass } from "@/components/admin/ui/styles";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/lib/product-images";

/** A single image URL with a preview, the media library picker, and a placeholder shortcut. */
export function ImageField({
  name,
  label,
  defaultValue = "",
  errors,
  required,
  canUpload,
  allowPlaceholder = false,
  id = name,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  errors?: string[];
  required?: boolean;
  canUpload: boolean;
  allowPlaceholder?: boolean;
  id?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const error = errors?.[0];

  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={24} aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={id}
            name={name}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required={required}
            inputMode="url"
            placeholder="https://… or /images/…"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <MediaPicker canUpload={canUpload} onSelect={setValue} />
            {allowPlaceholder && value !== PRODUCT_PLACEHOLDER_IMAGE && (
              <button type="button" onClick={() => setValue(PRODUCT_PLACEHOLDER_IMAGE)} className={buttonClass("ghost", "sm")}>
                Use placeholder
              </button>
            )}
            {!required && value && (
              <button type="button" onClick={() => setValue("")} className={buttonClass("ghost", "sm")}>
                Remove
              </button>
            )}
          </div>
          {error ? (
            <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>
          ) : (
            <p id={`${id}-hint`} className="text-xs text-slate-500">
              Pick from the media library, paste an https:// address, or use a file in <code>public/images</code> such as <code>/images/driver.jpg</code>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Up to eight extra images, one URL per line. */
export function GalleryField({ defaultValue = "", errors, canUpload }: { defaultValue?: string; errors?: string[]; canUpload: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const urls = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const error = errors?.[0];

  return (
    <div>
      <label htmlFor="gallery" className={labelClass}>Gallery images (optional)</label>
      <textarea
        id="gallery"
        name="gallery"
        rows={4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="One image URL per line"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "gallery-error" : undefined}
        className={inputClass}
      />
      {error && <p id="gallery-error" className="mt-1.5 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <MediaPicker canUpload={canUpload} label="Add from library" onSelect={(url) => setValue((current) => (current.trim() ? `${current.trim()}\n${url}` : url))} />
        {urls.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Gallery preview">
            {urls.slice(0, 8).map((url, index) => (
              <li key={`${url}-${index}`}>
                <img src={url} alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
