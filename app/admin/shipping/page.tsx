import { redirect } from "next/navigation";

// Shipping methods now live on the Settings page.
export default function Page() {
  redirect("/admin/settings#shipping");
}
