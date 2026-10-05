export default function OrganizerLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-[var(--skeleton)]" />
      <div className="h-32 rounded-2xl bg-[var(--skeleton)]" />
      <div className="h-48 rounded-2xl bg-[var(--skeleton)]" />
    </div>
  );
}
