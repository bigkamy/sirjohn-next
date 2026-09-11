import Link from "next/link";
import { MessageSquareText, Star } from "lucide-react";
import { ReviewActions } from "@/components/admin/reviews/review-actions";
import { ReviewStatusBadge } from "@/components/admin/ui/badge";
import { pageParam, Pagination, textParam } from "@/components/admin/ui/filter-bar";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { isReviewStatus, listReviews, type ReviewStatus } from "@/lib/admin-reviews";
import { requirePermission } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Reviews" };

const PAGE_SIZE = 20;
const TABS: { value: ReviewStatus | ""; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

export default async function Page({ searchParams }: PageProps<"/admin/reviews">) {
  await requirePermission("reviews.manage", "/admin/reviews");
  const params = await searchParams;
  const statusParam = textParam(params.status);
  // Pending first, since that's the queue that needs work.
  const status: ReviewStatus | "" = statusParam === "all" ? "" : isReviewStatus(statusParam) ? statusParam : "pending";
  const page = pageParam(params.page);

  const [{ reviews, total }, pendingCount] = await Promise.all([
    listReviews({ status: status || undefined, page, pageSize: PAGE_SIZE }),
    listReviews({ status: "pending", pageSize: 1 }).then((result) => result.total),
  ]);

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Only customers with a delivered order can review a product. Reviews appear on the store — and count towards its star rating — once you publish them."
      />

      <Card>
        <nav aria-label="Review status" className="flex flex-wrap gap-1 border-b border-slate-100 p-2">
          {TABS.map((tab) => {
            const active = tab.value === status;
            return (
              <Link
                key={tab.label}
                href={`/admin/reviews?status=${tab.value || "all"}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {tab.label}
                {tab.value === "pending" && pendingCount > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-xs text-amber-800">{pendingCount}</span>}
              </Link>
            );
          })}
        </nav>

        {reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquareText size={22} />}
            title={status === "pending" ? "No reviews waiting for moderation" : "No reviews here"}
            description="Customers can review products from their delivered orders in My Orders."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <li key={review.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex text-amber-500" role="img" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star key={index} size={14} className={index < review.rating ? "fill-current" : "text-slate-300"} aria-hidden />
                      ))}
                    </span>
                    <ReviewStatusBadge status={review.status} />
                    <Link href={`/product/${review.productSlug}`} target="_blank" prefetch={false} className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                      {review.productName}
                    </Link>
                  </div>
                  {review.title && <p className="mt-2 font-semibold text-slate-900">{review.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{review.body}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {review.authorName}
                    {review.customerEmail && ` (${review.customerEmail})`} · {formatDateTime(review.createdAt)}
                    {review.orderNumber && (
                      <>
                        {" · "}
                        <Link href={`/admin/orders/${encodeURIComponent(review.orderNumber)}`} className="text-emerald-700">
                          Order #{review.orderNumber}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <ReviewActions id={review.id} status={review.status} author={review.authorName} />
              </li>
            ))}
          </ul>
        )}
        <Pagination action="/admin/reviews" page={page} pageSize={PAGE_SIZE} total={total} params={{ status: status || "all" }} />
      </Card>
    </>
  );
}
