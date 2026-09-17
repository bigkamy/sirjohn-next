"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { AVATAR_BUCKET, isAvatarPathFor } from "@/lib/avatars";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message: string };

/**
 * Records a photo the browser has just uploaded to Storage. The path is checked against the
 * signed-in user, so a crafted request can't point a profile at somebody else's file — and
 * the bucket's policies would have refused the upload in the first place.
 */
export async function saveAvatar(path: string): Promise<Result> {
  const user = await requireUser("/account/profile");
  if (!isAvatarPathFor(user.id, path)) {
    return { ok: false, message: "That file isn't one of yours." };
  }

  const supabase = await createClient();
  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const { publicUrl } = bucket.getPublicUrl(path).data;

  const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (error) {
    console.error("Avatar update failed:", error.message);
    return { ok: false, message: "We couldn't save your photo. Please try again." };
  }

  // Tidy up whatever was there before, so a customer's folder only ever holds the current
  // photo. A leftover file would keep counting against storage without ever being shown.
  const { data: files } = await bucket.list(user.id);
  const stale = (files ?? []).map((file) => `${user.id}/${file.name}`).filter((candidate) => candidate !== path);
  if (stale.length > 0) {
    await bucket.remove(stale);
  }

  refresh();
  return { ok: true, message: "Your photo has been updated." };
}

/** Clears the photo and deletes the file, so the initials monogram comes back. */
export async function removeAvatar(): Promise<Result> {
  const user = await requireUser("/account/profile");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) {
    console.error("Avatar removal failed:", error.message);
    return { ok: false, message: "We couldn't remove your photo. Please try again." };
  }

  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const { data: files } = await bucket.list(user.id);
  if (files && files.length > 0) {
    await bucket.remove(files.map((file) => `${user.id}/${file.name}`));
  }

  refresh();
  return { ok: true, message: "Your photo has been removed." };
}
