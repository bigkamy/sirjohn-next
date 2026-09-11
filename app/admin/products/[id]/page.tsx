import { redirect } from "next/navigation";

// Old address for the product editor.
export default async function Page({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  redirect(`/admin/products/${encodeURIComponent(id)}/edit`);
}
