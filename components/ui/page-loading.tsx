/** Spinner shown while a dynamic page (account, cart, checkout, admin) loads. */
export function PageLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
