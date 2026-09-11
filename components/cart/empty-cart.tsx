import Link from "next/link";

export function EmptyCart() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
      <p className="mt-2 text-slate-600">Add some gear from the shop and it will appear here.</p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white">
        Continue Shopping
      </Link>
    </div>
  );
}
