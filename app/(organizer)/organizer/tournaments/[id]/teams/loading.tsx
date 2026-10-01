export default function TeamsLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading teams">
      <div className="h-10 w-40 rounded-lg bg-amber-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-amber-50" />
        <div className="h-28 rounded-2xl bg-amber-50" />
        <div className="h-28 rounded-2xl bg-amber-50" />
      </div>
    </div>
  );
}
