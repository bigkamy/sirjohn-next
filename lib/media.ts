import { slugify } from "@/lib/slug";

// The media library: a public Supabase Storage bucket (see 20260916000100_admin_platform.sql).
export const MEDIA_BUCKET = "media";
export const MEDIA_FOLDER = "library";
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const ACCEPTED_MEDIA_TYPES = Object.keys(MEDIA_TYPES).join(",");

export type MediaFile = {
  path: string;
  name: string;
  url: string;
  size: number;
  createdAt: string | null;
  mimeType: string | null;
};

/** Why a file can't be uploaded, or null if it's fine. The bucket enforces the same limits. */
export function mediaProblem(file: File): string | null {
  if (!MEDIA_TYPES[file.type]) return "use a JPG, PNG, WebP, AVIF or GIF image.";
  if (file.size > MAX_MEDIA_BYTES) return "images must be 5 MB or smaller.";
  return null;
}

/** A unique, URL-safe path for a new upload, e.g. library/1757590000000-driver-front.jpg. */
export function mediaPath(file: File) {
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 60) || "image";
  return `${MEDIA_FOLDER}/${Date.now()}-${base}.${MEDIA_TYPES[file.type]}`;
}

export function isMediaPath(path: unknown): path is string {
  return typeof path === "string" && /^library\/[a-z0-9-]+\.(jpg|png|webp|avif|gif)$/.test(path);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
