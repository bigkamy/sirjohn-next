import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { MEDIA_BUCKET, MEDIA_FOLDER, type MediaFile } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

/** Images in the media library, newest first. Storage policies limit this to staff with catalog access. */
export async function listMedia(): Promise<MediaFile[]> {
  await requirePermission("catalog.view", "/admin/media");
  const supabase = await createClient();
  const bucket = supabase.storage.from(MEDIA_BUCKET);

  const { data, error } = await bucket.list(MEDIA_FOLDER, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
  if (error) {
    throw new Error(`Failed to load media: ${error.message}`);
  }

  return data
    .filter((file) => file.id && !file.name.startsWith("."))
    .map((file) => {
      const path = `${MEDIA_FOLDER}/${file.name}`;
      return {
        path,
        name: file.name,
        url: bucket.getPublicUrl(path).data.publicUrl,
        size: Number(file.metadata?.size ?? 0),
        createdAt: file.created_at ?? null,
        mimeType: (file.metadata?.mimetype as string | undefined) ?? null,
      };
    });
}
