import { AdminHeading } from "@/components/admin/admin-heading";
import { ShippingMethodForm } from "@/components/admin/shipping-method-form";
import { listShippingMethodsForAdmin } from "@/lib/shipping";

export const metadata = { title: "Shipping Settings" };

export default async function Page() {
  // listShippingMethodsForAdmin checks the admin role before reading.
  const methods = await listShippingMethodsForAdmin();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading
        title="Shipping Settings"
        back={{ href: "/admin", label: "Back to dashboard" }}
        description="Checkout charges exactly these amounts, and the storefront’s free-shipping message follows the lowest “free when order reaches” value. Changes apply to new orders immediately."
      />

      <div className="space-y-5">
        {methods.map((method) => (
          <ShippingMethodForm key={method.code} method={method} />
        ))}
      </div>
    </main>
  );
}
