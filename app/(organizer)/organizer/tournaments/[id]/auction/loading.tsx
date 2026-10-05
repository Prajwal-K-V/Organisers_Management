export default function AuctionLoading() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4" aria-busy="true" aria-label="Loading auction">
      <div className="h-24 rounded-2xl bg-[var(--skeleton)]" />
      <div className="h-10 rounded-xl bg-[var(--skeleton)]" />
      <div className="h-48 rounded-xl bg-[var(--skeleton)]" />
      <div className="h-10 rounded-xl bg-[var(--skeleton)]" />
      <div className="h-12 rounded-xl bg-[var(--skeleton)]" />
    </div>
  );
}
