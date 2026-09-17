"use client";

import { Trash2, UploadCloud } from "lucide-react";
import { useState, useSyncExternalStore, useTransition } from "react";
import { FormAlert } from "@/components/auth/form-controls";
import { refreshShopperState } from "@/components/shopper/shopper-state";
import { removeAvatar, saveAvatar } from "@/lib/avatar-actions";
import { ACCEPTED_AVATAR_TYPES, AVATAR_BUCKET, avatarPath, avatarProblem } from "@/lib/avatars";
import { NETWORK_ERROR } from "@/lib/messages";
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

type AvatarFieldProps = {
  userId: string;
  initials: string;
  avatarUrl: string | null;
};

/**
 * The profile photo, with controls to replace or remove it. The file goes straight from the
 * browser to Supabase Storage — never through a Server Action — and the action that follows
 * only records the path. The bucket's policies confine the upload to this customer's folder.
 */
export function AvatarField({ userId, initials, avatarUrl }: AvatarFieldProps) {
  const [photo, setPhoto] = useState(avatarUrl);
  const [status, setStatus] = useState<{ error?: string; message?: string }>({});
  const [busy, setBusy] = useState(false);
  const [removing, startRemoving] = useTransition();
  // A file chosen before hydration would be dropped silently, so the picker waits for it.
  const hydrated = useHydrated();
  const working = busy || removing;

  async function upload(file: File | undefined) {
    if (!file || working) return;

    const problem = avatarProblem(file);
    if (problem) {
      setStatus({ error: problem });
      return;
    }

    setBusy(true);
    setStatus({});

    const bucket = createBrowserSupabase().storage.from(AVATAR_BUCKET);
    const path = avatarPath(userId, file);
    const { error } = await bucket.upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });

    if (error) {
      setBusy(false);
      setStatus({ error: "We couldn't upload that photo. Please try again." });
      return;
    }

    const result = await saveAvatar(path).catch(() => null);
    if (result?.ok) {
      setPhoto(bucket.getPublicUrl(path).data.publicUrl);
      // The header band reads the session separately, so nudge it to pick up the new photo.
      await refreshShopperState();
    }
    setStatus(result?.ok ? { message: result.message } : { error: result?.message ?? NETWORK_ERROR });
    setBusy(false);
  }

  function remove() {
    if (working) return;
    setStatus({});
    startRemoving(async () => {
      const result = await removeAvatar().catch(() => null);
      if (result?.ok) {
        setPhoto(null);
        await refreshShopperState();
      }
      setStatus(result?.ok ? { message: result.message } : { error: result?.message ?? NETWORK_ERROR });
    });
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-medium text-slate-700">Profile photo</h2>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        {photo ? (
          <img
            src={photo}
            alt="Your profile photo"
            width={80}
            height={80}
            className="h-20 w-20 shrink-0 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-xl font-bold text-white"
          >
            {initials}
          </span>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* has-[:disabled] dims the label while its own file input is disabled. */}
            <label className="cursor-pointer rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
              <span className="inline-flex items-center gap-2">
                <UploadCloud size={15} aria-hidden />
                {busy ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
              </span>
              <input
                type="file"
                accept={ACCEPTED_AVATAR_TYPES}
                disabled={working || !hydrated}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void upload(file);
                }}
              />
            </label>

            {photo && (
              <button
                type="button"
                onClick={remove}
                disabled={working}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                <Trash2 size={15} aria-hidden />
                {removing ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            JPG, PNG, WebP or AVIF, up to 2 MB. Shown in the header and on your account pages.
          </p>
        </div>
      </div>

      {(status.error || status.message) && (
        <div className="mt-5">
          <FormAlert error={status.error} message={status.message} />
        </div>
      )}
    </section>
  );
}
