"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { recordMediaUpload } from "@/lib/admin-media-actions";
import { ACCEPTED_MEDIA_TYPES, MEDIA_BUCKET, mediaPath, mediaProblem, type MediaFile } from "@/lib/media";
import { createBrowserSupabase } from "@/lib/supabase/client";

const noSubscription = () => () => {};

/** False while the server renders and React hydrates; true once event handlers are attached. */
function useHydrated() {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/**
 * Uploads straight from the browser to Supabase Storage, so large images never pass through
 * a Server Action. The bucket's policies only accept uploads from catalog managers.
 */
export function MediaUploader({ onUploaded, refreshAfter = false }: { onUploaded?: (file: MediaFile) => void; refreshAfter?: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  // A file chosen before hydration would be dropped silently, so the picker waits for it.
  const hydrated = useHydrated();

  async function upload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0 || busy) return;

    setBusy(true);
    const bucket = createBrowserSupabase().storage.from(MEDIA_BUCKET);
    let uploaded = 0;

    for (const file of files) {
      const problem = mediaProblem(file);
      if (problem) {
        toast({ tone: "error", message: `${file.name}: ${problem}` });
        continue;
      }

      const path = mediaPath(file);
      const { error } = await bucket.upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (error) {
        toast({ tone: "error", message: `${file.name} couldn't be uploaded. Please try again.` });
        continue;
      }

      await recordMediaUpload(path).catch(() => undefined);
      uploaded++;
      onUploaded?.({
        path,
        name: path.split("/").pop() ?? path,
        url: bucket.getPublicUrl(path).data.publicUrl,
        size: file.size,
        createdAt: new Date().toISOString(),
        mimeType: file.type,
      });
    }

    setBusy(false);
    if (input.current) input.current.value = "";
    if (uploaded > 0) {
      toast({ message: uploaded === 1 ? "Image uploaded." : `${uploaded} images uploaded.` });
      if (refreshAfter) router.refresh();
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void upload(event.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${dragging ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50/70"}`}
    >
      <UploadCloud size={28} className="mx-auto text-slate-400" aria-hidden />
      <p className="mt-2 text-sm text-slate-600">Drag images here, or</p>
      <label className={`${buttonClass("secondary", "sm")} mt-2 cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600`}>
        {busy ? "Uploading…" : "Choose images"}
        <input
          ref={input}
          type="file"
          accept={ACCEPTED_MEDIA_TYPES}
          multiple
          disabled={busy || !hydrated}
          className="sr-only"
          onChange={(event) => void upload(event.target.files)}
        />
      </label>
      <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP, AVIF, or GIF, up to 5 MB each.</p>
      {busy && (
        <p role="status" className="mt-2 text-xs font-medium text-emerald-700">
          Uploading…
        </p>
      )}
    </div>
  );
}
