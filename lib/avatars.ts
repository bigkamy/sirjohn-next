// Profile photos: a public Supabase Storage bucket where each customer writes only inside a
// folder named after their own user id (see 20260921000000_profile_avatars.sql).
export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const ACCEPTED_AVATAR_TYPES = Object.keys(AVATAR_TYPES).join(",");

/** Why a photo can't be uploaded, or null if it's fine. The bucket enforces the same limits. */
export function avatarProblem(file: File): string | null {
  if (!AVATAR_TYPES[file.type]) return "Use a JPG, PNG, WebP or AVIF image.";
  if (file.size > MAX_AVATAR_BYTES) return "Photos must be 2 MB or smaller.";
  return null;
}

/**
 * Where a customer's new photo goes, e.g. 3f9a…/1757590000000.jpg. The timestamp makes every
 * upload a new URL, so a replaced photo is never served from a browser or CDN cache.
 */
export function avatarPath(userId: string, file: File) {
  return `${userId}/${Date.now()}.${AVATAR_TYPES[file.type]}`;
}

/** Checked again on the server before the path is written to a profile. */
export function isAvatarPathFor(userId: string, path: unknown): path is string {
  if (typeof path !== "string" || !/^[^/]+\/\d+\.(jpg|png|webp|avif)$/.test(path)) {
    return false;
  }
  return path.split("/")[0] === userId;
}
