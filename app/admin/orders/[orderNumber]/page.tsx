import { notFound } from "next/navigation";
import { AdminHeading } from "@/components/admin/admin-heading";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { OrderDetails } from "@/components/orders/order-details";
import { formatDate } from "@/lib/format";
import { getOrderForAdmin } from "@/lib/orders";

export const metadata = { title: "Order Details" };

export default async function Page({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  // getOrderForAdmin checks the admin role before reading.
  const order = await getOrderForAdmin(orderNumber);
  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading
        title={`#${order.orderNumber}`}
        back={{ href: "/admin/orders", label: "Back to orders" }}
        description={`Placed ${formatDate(order.createdAt)} by ${order.shippingAddress.fullName} (${order.email})`}
      />

      <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Fulfilment</h2>
        <OrderStatusControl orderNumber={order.orderNumber} status={order.status} />
        {order.paymentStatus === "paid" && (
          <p className="mt-3 text-sm text-slate-500">This order is paid. Cancelling it does not refund the customer automatically.</p>
        )}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <OrderDetails order={order} />
      </div>
    </main>
  );
}
