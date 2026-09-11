import "server-only";
import { requireUser } from "@/lib/auth/dal";
import type { PaymentMethod } from "@/lib/checkout";
import type { PaymentStatus } from "@/lib/order-status";
import type { SelectedOptions } from "@/lib/product-options";
import { createClient } from "@/lib/supabase/server";

export type OrderSummary = {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
};

export type OrderDetail = OrderSummary & {
  id: string;
  userId: string | null;
  paymentStatus: PaymentStatus;
  email: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingMethod: string;
  paymentMethod: PaymentMethod;
  couponCode: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  items: {
    id: number;
    /** Null once the product has been deleted; the line keeps its name and price. */
    productId: number | null;
    productName: string;
    options: SelectedOptions;
    slug: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

type ShippingAddressRow = {
  full_name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
};

// Without generated database types supabase-js types every embed as an array, but
// shipping_methods and products are to-one embeds, so the row shape is spelled out here.
type OrderRow = {
  id: string;
  user_id: string | null;
  order_number: string;
  status: string;
  payment_status: PaymentStatus;
  created_at: string;
  email: string;
  shipping_address: ShippingAddressRow;
  shipping_method: string;
  payment_method: PaymentMethod;
  coupon_code: string | null;
  subtotal: number | string;
  shipping: number | string;
  discount: number | string;
  total: number | string;
  shipping_methods: { name: string } | null;
  order_items: {
    id: number;
    product_id: number | null;
    product_name: string;
    options: SelectedOptions | null;
    unit_price: number | string;
    quantity: number;
    products: { slug: string; image: string } | null;
  }[];
};

const ORDER_DETAIL_COLUMNS =
  "id,user_id,order_number,status,payment_status,created_at,email,shipping_address,shipping_method,payment_method,coupon_code,subtotal,shipping,discount,total,shipping_methods(name),order_items(id,product_id,product_name,options,unit_price,quantity,products(slug,image))";

const countItems = (items: { quantity: number }[]) => items.reduce((sum, item) => sum + item.quantity, 0);

// Customer queries filter by user explicitly: RLS also lets admins read every order.

export async function listOrders(limit?: number): Promise<OrderSummary[]> {
  const user = await requireUser("/account/orders");
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("order_number,status,total,created_at,order_items(quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return data.map((row) => ({
    orderNumber: row.order_number,
    status: row.status,
    total: Number(row.total),
    createdAt: row.created_at,
    itemCount: countItems(row.order_items),
  }));
}

export async function getOrder(orderNumber: string): Promise<OrderDetail | null> {
  const user = await requireUser(`/account/orders/${encodeURIComponent(orderNumber)}`);
  return fetchOrderDetail(orderNumber, user.id);
}

/**
 * One order with its items. Pass a user id to restrict it to that customer; the admin panel
 * passes null after checking orders.view (RLS also lets staff read every order).
 */
export async function fetchOrderDetail(orderNumber: string, userId: string | null): Promise<OrderDetail | null> {
  const supabase = await createClient();

  let query = supabase.from("orders").select(ORDER_DETAIL_COLUMNS).eq("order_number", orderNumber);
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.order("id", { referencedTable: "order_items" }).maybeSingle();
  if (error) {
    throw new Error(`Failed to load order ${orderNumber}: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const order = data as unknown as OrderRow;
  const address = order.shipping_address;
  const items = order.order_items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    options: item.options ?? {},
    slug: item.products?.slug ?? null,
    image: item.products?.image ?? null,
    unitPrice: Number(item.unit_price),
    quantity: item.quantity,
    lineTotal: Number(item.unit_price) * item.quantity,
  }));

  return {
    id: order.id,
    userId: order.user_id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    createdAt: order.created_at,
    itemCount: countItems(items),
    email: order.email,
    shippingAddress: {
      fullName: address.full_name,
      phone: address.phone,
      line1: address.line1,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country ?? "India",
    },
    shippingMethod: order.shipping_methods?.name ?? order.shipping_method,
    paymentMethod: order.payment_method,
    couponCode: order.coupon_code,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    items,
  };
}
