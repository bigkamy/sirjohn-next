import { MediaLibrary } from "@/components/admin/media/media-library";
import { MediaUploader } from "@/components/admin/media/media-uploader";
import { Card, CardHeader, Notice, PageHeader } from "@/components/admin/ui/primitives";
import { listMedia } from "@/lib/admin-media";
import { requirePermission } from "@/lib/auth/dal";
import type { MediaFile } from "@/lib/media";

export const metadata = { title: "Media" };

export default async function Page() {
  const staff = await requirePermission("catalog.view", "/admin/media");
  const canManage = staff.permissions.has("catalog.manage");

  let files: MediaFile[] = [];
  let unavailable = false;
  try {
    files = await listMedia();
  } catch (error) {
    console.error(error);
    unavailable = true;
  }

  return (
    <>
      <PageHeader
        title="Media library"
        description="Product and category photos, stored in your Supabase project. Anyone can view an image by its URL; only catalog managers can upload or delete."
      />

      {unavailable ? (
        <Notice tone="warning">
          The media library couldn&apos;t be loaded. Check that the migration <code>20260916000100_admin_platform.sql</code> has been applied, which creates the
          <code> media</code> storage bucket.
        </Notice>
      ) : (
        <div className="space-y-6">
          {canManage && (
            <Card>
              <CardHeader title="Upload images" />
              <div className="p-5">
                <MediaUploader refreshAfter />
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title={`${files.length} ${files.length === 1 ? "image" : "images"}`} />
            <MediaLibrary files={files} canManage={canManage} />
          </Card>
        </div>
      )}
    </>
  );
}
