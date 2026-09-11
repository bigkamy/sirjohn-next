"use client";

import { ImagePlus, X } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";
import { MediaUploader } from "@/components/admin/media/media-uploader";
import { buttonClass } from "@/components/admin/ui/styles";
import { listMediaAction } from "@/lib/admin-media-actions";
import type { MediaFile } from "@/lib/media";
import { NETWORK_ERROR } from "@/lib/messages";

/** Opens the media library in a dialog; picking an image hands its URL back. */
export function MediaPicker({ onSelect, canUpload, label = "Choose from library" }: { onSelect: (url: string) => void; canUpload: boolean; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();

  const open = () => {
    dialog.current?.showModal();
    startLoading(async () => {
      const result = await listMediaAction().catch(() => ({ ok: false as const, message: NETWORK_ERROR }));
      if (result.ok) {
        setFiles(result.files);
        setError(null);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <>
      <button type="button" onClick={open} className={buttonClass("secondary", "sm")}>
        <ImagePlus size={14} aria-hidden /> {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(56rem,calc(100%-2rem))] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold">Media library</h2>
          <button type="button" aria-label="Close media library" onClick={() => dialog.current?.close()} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          {canUpload && <MediaUploader onUploaded={(file) => setFiles((list) => [file, ...(list ?? [])])} />}
          {error ? (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          ) : files === null || (loading && files.length === 0) ? (
            <p className="text-sm text-slate-500">Loading images…</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-slate-500">No images yet.{canUpload ? " Upload one above." : ""}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {files.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(file.url);
                      dialog.current?.close();
                    }}
                    className="block w-full overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-600"
                  >
                    <img src={file.url} alt="" className="aspect-square w-full bg-slate-50 object-cover" />
                    <span className="block truncate px-2 py-1.5 text-xs text-slate-600">{file.name}</span>
                    <span className="sr-only">Use this image</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
