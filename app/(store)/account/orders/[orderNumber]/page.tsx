import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountLayout } from "@/components/account/account-layout";
import { OrderDetails } from "@/components/orders/order-details";
import { ReviewForm } from "@/components/reviews/review-form";
import { requireUser } from "@/lib/auth/dal";
import { formatDate } from "@/lib/format";
import { getOrder } from "@/lib/orders";
import { getMyReviews } from "@/lib/reviews";

export const metadata = { title: "Order Details" };

export default async function Page({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const user = await requireUser(`/account/orders/${encodeURIComponent(orderNumber)}`);
  const order = await getOrder(orderNumber);
  if (!order) {
    notFound();
  }

  // Verified reviews: only delivered orders, one review per product (options don't matter).
  const reviewable =
    order.status === "delivered"
      ? [...new Map(order.items.filter((item) => item.productId !== null).map((item) => [item.productId as number, item])).values()]
      : [];
  const myReviews = reviewable.length > 0 ? await getMyReviews() : new Map();

  return (
    <AccountLayout user={user}>
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Link href="/account/orders" className="text-sm font-medium text-emerald-700">← Back to orders</Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Order details</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">#{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <OrderDetails order={order} />
        </div>

        {reviewable.length > 0 && (
          <section aria-labelledby="reviews-heading" className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 id="reviews-heading" className="text-xl font-bold text-slate-900">Review your items</h2>
            <p className="mt-1 text-sm text-slate-500">Tell other golfers what you think. Your review helps them choose.</p>
            <div className="mt-5 space-y-6">
              {reviewable.map((item) => (
                <div key={item.productId} className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
                  <p className="mb-3 font-semibold text-slate-900">{item.productName}</p>
                  <ReviewForm productId={item.productId as number} productName={item.productName} orderNumber={order.orderNumber} existing={myReviews.get(item.productId)} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AccountLayout>
  );
}
