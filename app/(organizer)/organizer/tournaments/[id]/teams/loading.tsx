export default function TeamsLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading teams">
      <div className="h-10 w-40 rounded-lg bg-[var(--skeleton)]" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-[var(--skeleton)]" />
        <div className="h-28 rounded-2xl bg-[var(--skeleton)]" />
        <div className="h-28 rounded-2xl bg-[var(--skeleton)]" />
      </div>
    </div>
  );
}
