export default function TournamentSectionLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-24 rounded-2xl bg-amber-50" />
      <div className="h-40 rounded-2xl bg-amber-50" />
    </div>
  );
}
