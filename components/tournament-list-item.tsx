import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TournamentStatus } from "@/types/database";

export function TournamentListItem({
  href,
  name,
  status,
  hint = "Open tournament hub — teams, players, auction & finance",
}: {
  href: string;
  name: string;
  status: TournamentStatus;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border-2 border-[var(--border-subtle)] bg-white px-4 py-4 transition hover:border-[var(--primary)] hover:bg-[var(--accent-soft)]/60 hover:shadow-[var(--shadow-card)] sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">{name}</p>
        <p className="mt-0.5 text-sm text-[var(--muted)]">{hint}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)] opacity-0 transition group-hover:opacity-100">
          Click to continue →
        </p>
      </div>
      <Badge variant="accent">{status}</Badge>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-bold text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
