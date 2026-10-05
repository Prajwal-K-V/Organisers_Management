export default function FinanceLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading finance">
      <div className="h-24 rounded-2xl bg-[var(--skeleton)]" />
      <div className="h-16 rounded-xl bg-[var(--skeleton)]" />
      <div className="h-16 rounded-xl bg-[var(--skeleton)]" />
      <div className="h-16 rounded-xl bg-[var(--skeleton)]" />
    </div>
  );
}
