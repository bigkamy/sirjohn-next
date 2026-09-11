import { AdminHeading } from "@/components/admin/admin-heading";
import { AddCategoryForm, CategoryRow } from "@/components/admin/category-forms";
import { listCategoriesForAdmin } from "@/lib/admin-categories";

export const metadata = { title: "Categories" };

export default async function Page() {
  // listCategoriesForAdmin checks the admin role before reading.
  const categories = await listCategoriesForAdmin();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading
        title="Categories"
        back={{ href: "/admin", label: "Back to dashboard" }}
        description="Categories organise the shop filters, the menu, and the home page tiles. The first four by display order appear in the main menu. Renaming a category moves its products with it."
      />

      <AddCategoryForm />

      <div className="mt-6 space-y-4">
        {categories.length === 0 && <p className="text-sm text-slate-500">No categories yet.</p>}
        {/* Keyed by id alone so a rename doesn't remount the row and drop its "Saved." message. */}
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </div>
    </main>
  );
}
