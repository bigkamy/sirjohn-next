export function StockWarning({ quantity, stock }: { quantity: number; stock: number }) {
  if (quantity <= stock) {
    return null;
  }

  return (
    <p className="mt-1 text-sm font-medium text-red-600">{stock > 0 ? `Only ${stock} left in stock` : "Out of stock"}</p>
  );
}
