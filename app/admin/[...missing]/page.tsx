import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/dal";

// Unknown /admin addresses show the admin 404 inside the admin shell — to staff only.
export default async function Page({ params }: PageProps<"/admin/[...missing]">) {
  const { missing } = await params;
  await requireStaff(`/admin/${missing.join("/")}`);
  notFound();
}
