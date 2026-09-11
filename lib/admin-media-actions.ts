"use server";

import { revalidatePath } from "next/cache";
import { listMedia } from "@/lib/admin-media";
import { logAdminError, logAdminEvent } from "@/lib/admin/log";
import { requirePermission } from "@/lib/auth/dal";
import { isMediaPath, MEDIA_BUCKET, type MediaFile } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message: string };

/** For the image picker inside the product and category forms. */
export async function listMediaAction(): Promise<{ ok: true; files: MediaFile[] } | { ok: false; message: string }> {
  await requirePermission("catalog.view", "/admin/media");
  try {
    return { ok: true, files: await listMedia() };
  } catch (error) {
    await logAdminError("media.list", "media", null, error instanceof Error ? error.message : String(error));
    return { ok: false, message: "We couldn't load the media library. Please try again." };
  }
}

/** Files go straight from the browser to Storage; this records the upload afterwards. */
export async function recordMediaUpload(path: string): Promise<Result> {
  await requirePermission("catalog.manage", "/admin/media");
  if (!isMediaPath(path)) {
    return { ok: false, message: "That file isn't in the media library." };
  }
  await logAdminEvent("media.uploaded", "media", path, `Uploaded ${path.split("/").pop()}`);
  revalidatePath("/admin/media");
  return { ok: true, message: "Uploaded." };
}

export async function deleteMedia(path: string): Promise<Result> {
  await requirePermission("catalog.manage", "/admin/media");
  if (!isMediaPath(path)) {
    return { ok: false, message: "That file isn't in the media library." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error || !data?.length) {
    await logAdminError("media.delete", "media", path, error?.message ?? "File not found or not permitted");
    return { ok: false, message: "We couldn't delete this image. Please try again." };
  }

  await logAdminEvent("media.deleted", "media", path, `Deleted ${path.split("/").pop()}`);
  revalidatePath("/admin/media");
  return { ok: true, message: "Image deleted." };
}
