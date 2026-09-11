import Link from "next/link";
import { AdminHeading } from "@/components/admin/admin-heading";
import { OrdersTable } from "@/components/admin/orders-table";
import { listOrdersForAdmin } from "@/lib/orders";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 25;

export default async function Page({ searchParams }: PageProps<"/admin/orders">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof pageParam === "string" ? pageParam : "1", 10) || 1);
  // listOrdersForAdmin checks the admin role before reading.
  const { orders, total } = await listOrdersForAdmin({ page, pageSize: PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeading title="Orders" back={{ href: "/admin", label: "Back to dashboard" }} description={`${total} orders in total.`} />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <OrdersTable orders={orders} />

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm">
            {page > 1 ? (
              <Link href={`/admin/orders?page=${page - 1}`} className="font-semibold text-emerald-700">← Newer</Link>
            ) : (
              <span />
            )}
            <span className="text-slate-500">Page {page} of {pages}</span>
            {page < pages ? (
              <Link href={`/admin/orders?page=${page + 1}`} className="font-semibold text-emerald-700">Older →</Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
