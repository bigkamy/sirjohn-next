import { formatPrice } from "@/lib/format";

type PriceRowsProps = {
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string | null;
};

/** Subtotal, shipping, and discount lines shared by the cart, checkout, and order views. */
export function PriceRows({ subtotal, shipping, discount, couponCode }: PriceRowsProps) {
  return (
    <>
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
      </div>
      <div className="flex justify-between">
        <span>Discount{couponCode ? ` (${couponCode})` : ""}</span>
        <span>{discount > 0 ? `−${formatPrice(discount)}` : "₹0"}</span>
      </div>
    </>
  );
}
