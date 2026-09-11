import Link from "next/link";
import { Boxes, ClipboardCheck, Users } from "lucide-react";
import { RemoveSamplesButton } from "@/components/admin/remove-samples-button";
import { StockBadge } from "@/components/admin/ui/badge";
import { Card, CardHeader, EmptyState } from "@/components/admin/ui/primitives";
import type { AdminCustomer } from "@/lib/admin-customers";
import type { InventoryItem } from "@/lib/admin-inventory";
import { formatDate, formatPrice } from "@/lib/format";
import type { ChecklistItem } from "@/lib/launch-checklist";

export function LowStockList({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Boxes size={22} />}
        title="Stock levels look healthy"
        description="Visible products at or below their low-stock threshold appear here."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-5 py-3">
          <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">
              {item.sku ? `SKU ${item.sku} · ` : ""}Alert at {item.lowStockThreshold}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-semibold tabular-nums text-slate-900">{item.stock} left</span>
            <StockBadge stock={item.stock} threshold={item.lowStockThreshold} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RecentCustomers({ customers }: { customers: AdminCustomer[] }) {
  if (customers.length === 0) {
    return <EmptyState icon={<Users size={22} />} title="No customers yet" description="Customers appear here when they create an account." />;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {customers.map((customer) => (
        <li key={customer.id}>
          <Link href={`/admin/customers/${customer.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              {(customer.firstName.charAt(0) + customer.lastName.charAt(0) || customer.email.charAt(0)).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{customer.name}</p>
              <p className="truncate text-xs text-slate-500">{customer.email}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Joined {formatDate(customer.createdAt)}</p>
              <p className="tabular-nums">
                {customer.orderCount} {customer.orderCount === 1 ? "order" : "orders"} · {formatPrice(customer.totalSpent)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LaunchChecklistCard({ items }: { items: ChecklistItem[] }) {
  return (
    <Card className="mt-6 border-amber-200">
      <CardHeader title="Launch checklist" description="These still need attention before the store goes live." />
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
            <ClipboardCheck size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{item.detail}</p>
              {item.link && (
                <Link href={item.link.href} className="mt-1 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-900">
                  {item.link.label}
                </Link>
              )}
            </div>
            {item.sampleCount !== undefined && <RemoveSamplesButton count={item.sampleCount} />}
          </li>
        ))}
      </ul>
    </Card>
  );
}
