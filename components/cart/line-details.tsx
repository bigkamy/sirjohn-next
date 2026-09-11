import { StockWarning } from "@/components/cart/stock-warning";
import { formatOptions, type SelectedOptions } from "@/lib/product-options";

/** Chosen options plus any stock or configuration problems for a cart line. */
export function LineDetails({
  options,
  optionsValid,
  quantity,
  stock,
}: {
  options: SelectedOptions;
  optionsValid: boolean;
  quantity: number;
  stock: number;
}) {
  return (
    <>
      {Object.keys(options).length > 0 && <p className="mt-1 text-sm text-slate-500">{formatOptions(options)}</p>}
      {!optionsValid && (
        <p className="mt-1 text-sm font-medium text-red-600">These options are no longer offered. Please remove this item.</p>
      )}
      <StockWarning quantity={quantity} stock={stock} />
    </>
  );
}
