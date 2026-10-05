export default function PlayersLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading players">
      <div className="h-14 rounded-2xl bg-[var(--skeleton)]" />
      <div className="h-24 rounded-2xl bg-[var(--skeleton)]" />
      <div className="h-24 rounded-2xl bg-[var(--skeleton)]" />
      <div className="h-24 rounded-2xl bg-[var(--skeleton)]" />
    </div>
  );
}
