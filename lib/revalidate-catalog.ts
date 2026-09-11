import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_CACHE_TAG } from "@/lib/products";

/** After a catalog change: refresh the cached category list and every prerendered page. */
export function invalidateCatalog() {
  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
