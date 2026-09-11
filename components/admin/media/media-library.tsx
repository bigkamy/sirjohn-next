"use client";

import { Copy, ImageIcon, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { EmptyState } from "@/components/admin/ui/primitives";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { deleteMedia } from "@/lib/admin-media-actions";
import { formatBytes, type MediaFile } from "@/lib/media";
import { NETWORK_ERROR } from "@/lib/messages";

export function MediaLibrary({ files, canManage }: { files: MediaFile[]; canManage: boolean }) {
  const toast = useToast();

  if (files.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon size={22} />}
        title="No images yet"
        description={canManage ? "Upload product and category photos above, then pick them from any image field." : "Images uploaded by the catalog team appear here."}
      />
    );
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ message: "Image URL copied." });
    } catch {
      toast({ tone: "error", message: "Couldn't copy automatically. Select the URL and copy it instead." });
    }
  };

  return (
    <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {files.map((file) => (
        <li key={file.path} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={file.url} alt="" className="aspect-square w-full bg-slate-50 object-cover" />
          <div className="space-y-2 p-3">
            <p className="truncate text-xs font-medium text-slate-800" title={file.name}>{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => void copy(file.url)} className={buttonClass("secondary", "sm")} aria-label={`Copy URL of ${file.name}`}>
                <Copy size={13} aria-hidden /> URL
              </button>
              {canManage && (
                <ConfirmButton
                  label={<Trash2 size={13} aria-hidden />}
                  ariaLabel={`Delete ${file.name}`}
                  title="Delete this image?"
                  description="Products or categories still using it will show a missing image until you choose another."
                  confirmLabel="Delete image"
                  onConfirm={async () => {
                    const result = await deleteMedia(file.path).catch(() => ({ ok: false, message: NETWORK_ERROR }));
                    toast({ message: result.message, tone: result.ok ? "success" : "error" });
                  }}
                />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
