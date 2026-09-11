import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Error 404</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-4 text-lg text-slate-600">The page you’re looking for doesn’t exist or is no longer available.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white">Browse the Shop</Link>
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700">Back to Home</Link>
        </div>
      </div>
    </main>
  );
}
