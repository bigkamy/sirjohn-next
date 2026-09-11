import { FolderTree } from "lucide-react";
import { AddCategoryForm, CategoryRow } from "@/components/admin/category-forms";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { listCategoriesForAdmin } from "@/lib/admin-categories";
import { requirePermission } from "@/lib/auth/dal";

export const metadata = { title: "Categories" };

export default async function Page() {
  const staff = await requirePermission("catalog.view", "/admin/categories");
  const canManage = staff.permissions.has("catalog.manage");
  const categories = await listCategoriesForAdmin();

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories drive the shop filters, the main menu (the first four by display order), and the home page tiles. Renaming a category moves its products with it."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader title={`${categories.length} ${categories.length === 1 ? "category" : "categories"}`} />
          {categories.length === 0 ? (
            <EmptyState icon={<FolderTree size={22} />} title="No categories yet" description={canManage ? "Add your first category to start adding products." : undefined} />
          ) : (
            // Keyed by id alone so a rename doesn't remount the row and drop its state.
            <ul className="divide-y divide-slate-100">
              {categories.map((category) => (
                <CategoryRow key={category.id} category={category} canManage={canManage} />
              ))}
            </ul>
          )}
        </Card>

        {canManage && (
          <Card>
            <CardHeader title="Add a category" />
            <AddCategoryForm />
          </Card>
        )}
      </div>
    </>
  );
}
