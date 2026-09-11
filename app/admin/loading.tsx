// Shown inside the admin shell while a page loads; the sidebar and header stay in place.
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white shadow-sm" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
