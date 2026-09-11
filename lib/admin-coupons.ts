import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type CouponState = "active" | "inactive" | "scheduled" | "expired" | "used_up";

export type Coupon = {
  id: number;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  state: CouponState;
};

type CouponRow = {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  value: number | string;
  min_subtotal: number | string;
  max_discount: number | string | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
};

// Mirrors the checks quote_cart applies at checkout.
function couponState(row: CouponRow, now: number): CouponState {
  if (!row.is_active) return "inactive";
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return "scheduled";
  if (row.expires_at && new Date(row.expires_at).getTime() <= now) return "expired";
  if (row.usage_limit !== null && row.used_count >= row.usage_limit) return "used_up";
  return "active";
}

export async function listCoupons(): Promise<Coupon[]> {
  await requirePermission("coupons.manage", "/admin/coupons");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("id,code,description,discount_type,value,min_subtotal,max_discount,starts_at,expires_at,usage_limit,used_count,is_active,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load coupons: ${error.message}`);
  }

  const now = Date.now();
  return (data as CouponRow[]).map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    value: Number(row.value),
    minSubtotal: Number(row.min_subtotal),
    maxDiscount: row.max_discount === null ? null : Number(row.max_discount),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    isActive: row.is_active,
    createdAt: row.created_at,
    state: couponState(row, now),
  }));
}
