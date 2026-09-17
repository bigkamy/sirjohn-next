import Link from "next/link";
import { Pencil, Tag } from "lucide-react";
import { CouponActiveSwitch, CouponForm, DeleteCouponButton } from "@/components/admin/coupons/coupon-controls";
import { Badge, type BadgeTone } from "@/components/admin/ui/badge";
import { textParam } from "@/components/admin/ui/filter-bar";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { buttonClass } from "@/components/admin/ui/styles";
import { Table, TBody, Td, Th, THead } from "@/components/admin/ui/table";
import { listCoupons, type Coupon, type CouponState } from "@/lib/admin-coupons";
import { toIndiaLocal } from "@/lib/admin/datetime";
import { requirePermission } from "@/lib/auth/dal";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Coupons" };

const STATE: Record<CouponState, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Off", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "info" },
  expired: { label: "Expired", tone: "neutral" },
  used_up: { label: "Used up", tone: "warning" },
};

const discountText = (coupon: Coupon) =>
  coupon.discountType === "percent"
    ? `${coupon.value}% off${coupon.maxDiscount ? `, up to ${formatPrice(coupon.maxDiscount)}` : ""}`
    : `${formatPrice(coupon.value)} off`;

const formValues = (coupon?: Coupon): Record<string, string> =>
  coupon
    ? {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        value: String(coupon.value),
        minSubtotal: String(coupon.minSubtotal),
        maxDiscount: coupon.maxDiscount === null ? "" : String(coupon.maxDiscount),
        usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
        startsAt: toIndiaLocal(coupon.startsAt),
        expiresAt: toIndiaLocal(coupon.expiresAt),
        isActive: coupon.isActive ? "on" : "",
      }
    : { discountType: "percent", minSubtotal: "0", isActive: "on" };

export default async function Page({ searchParams }: PageProps<"/admin/coupons">) {
  await requirePermission("coupons.manage", "/admin/coupons");
  const params = await searchParams;
  const coupons = await listCoupons();
  const editing = coupons.find((coupon) => String(coupon.id) === textParam(params.edit));

  return (
    <>
      <PageHeader title="Coupons" description="Codes are checked at checkout against the minimum order, dates, and usage limit. Discounts never exceed the order subtotal." />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader title={`${coupons.length} ${coupons.length === 1 ? "coupon" : "coupons"}`} />
          {coupons.length === 0 ? (
            <EmptyState icon={<Tag size={22} />} title="No coupons yet" description="Create one with the form." />
          ) : (
            <Table label="Coupons">
              <THead>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th className="hidden md:table-cell">Min. order</Th>
                <Th className="hidden md:table-cell">Used</Th>
                <Th className="hidden lg:table-cell">Valid</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <TBody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className={editing?.id === coupon.id ? "bg-brand-50/50" : undefined}>
                    <Td>
                      <p className="font-mono font-semibold text-slate-900">{coupon.code}</p>
                      {coupon.description && <p className="max-w-[220px] truncate text-xs text-slate-500">{coupon.description}</p>}
                    </Td>
                    <Td className="whitespace-nowrap">{discountText(coupon)}</Td>
                    <Td className="hidden md:table-cell">{coupon.minSubtotal > 0 ? formatPrice(coupon.minSubtotal) : "—"}</Td>
                    <Td className="hidden tabular-nums md:table-cell">
                      {coupon.usedCount}
                      {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
                    </Td>
                    <Td className="hidden whitespace-nowrap text-xs lg:table-cell">
                      {coupon.startsAt || coupon.expiresAt
                        ? `${coupon.startsAt ? formatDate(coupon.startsAt) : "Now"} – ${coupon.expiresAt ? formatDate(coupon.expiresAt) : "no end"}`
                        : "Always"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <CouponActiveSwitch key={`${coupon.id}-${coupon.isActive}`} id={coupon.id} code={coupon.code} isActive={coupon.isActive} />
                        <Badge tone={STATE[coupon.state].tone}>{STATE[coupon.state].label}</Badge>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/coupons?edit=${coupon.id}`} aria-label={`Edit ${coupon.code}`} className={buttonClass("secondary", "sm")}>
                          <Pencil size={13} aria-hidden /> Edit
                        </Link>
                        <DeleteCouponButton id={coupon.id} code={coupon.code} usedCount={coupon.usedCount} />
                      </div>
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title={editing ? `Edit ${editing.code}` : "Create a coupon"} />
          <CouponForm key={editing?.id ?? "new"} couponId={editing?.id} defaults={formValues(editing)} />
        </Card>
      </div>
    </>
  );
}
