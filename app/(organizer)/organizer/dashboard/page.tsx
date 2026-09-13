import Link from "next/link";
import { DashboardDateFilter } from "@/components/dashboard-date-filter";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { PageHeader } from "@/components/page-header";
import { TournamentListItem } from "@/components/tournament-list-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCredits, sumLedgerFlows } from "@/lib/dashboard-finance";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

function endOfDayIso(date: string) {
  return `${date}T23:59:59.999Z`;
}

export default async function OrganizerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { profile } = await requireOrganizer();
  const { from, to } = await searchParams;
  const supabase = createClient(await cookies());

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, status, created_at")
    .eq("organizer_id", profile.id)
    .order("created_at", { ascending: false });

  const tournamentIds = (tournaments ?? []).map((t) => t.id);

  const [ledgerRes, teamsRes, playersRes] = await Promise.all([
    (async () => {
      if (!tournamentIds.length) return { data: [] as { entry_type: string; amount: number }[] };
      let q = supabase
        .from("financial_ledger")
        .select("entry_type, amount, created_at, description, tournament_id")
        .in("tournament_id", tournamentIds);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", endOfDayIso(to));
      return q;
    })(),
    tournamentIds.length
      ? supabase.from("teams").select("id", { count: "exact", head: true }).in("tournament_id", tournamentIds)
      : Promise.resolve({ count: 0 }),
    tournamentIds.length
      ? supabase.from("players").select("id, status").in("tournament_id", tournamentIds)
      : Promise.resolve({ data: [] as { id: string; status: string }[] }),
  ]);

  const finance = sumLedgerFlows(ledgerRes.data ?? []);
  const players = playersRes.data ?? [];
  const soldCount = players.filter((p) => p.status === "sold").length;
  const teamCount = teamsRes.count ?? 0;
  const playerCount = players.length;

  const periodLabel =
    from && to ? `${from} → ${to}` : from ? `From ${from}` : to ? `Until ${to}` : "All time";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile.full_name || profile.email}. Overview for ${periodLabel.toLowerCase()}.`}
        action={<DashboardDateFilter from={from} to={to} />}
      />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">Your events</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Open a tournament to add teams, run the auction, and track finance.
          </p>
        </div>
        <Link href="/organizer/tournaments">
          <Button className="w-full sm:w-auto">Go to tournaments</Button>
        </Link>
      </Card>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">At a glance</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardStatCard label="Total income" value={formatCredits(finance.income)} tone="income" hint="Credits in" />
          <DashboardStatCard label="Total outgoing" value={formatCredits(finance.outgoing)} tone="outgoing" hint="Credits out" />
          <DashboardStatCard label="Net balance" value={formatCredits(finance.net)} tone="default" />
          <DashboardStatCard label="Tournaments" value={tournaments?.length ?? 0} tone="neutral" />
          <DashboardStatCard label="Teams" value={teamCount} tone="neutral" />
          <DashboardStatCard label="Players" value={playerCount} tone="neutral" hint={`${soldCount} sold`} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold">Finance summary</h2>
            <p className="text-sm text-[var(--muted)]">Income and outgoing from the ledger ({periodLabel}).</p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-soft)]/40 p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Income</dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--success-text)]">{formatCredits(finance.income)}</dd>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Outgoing</dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--danger)]">{formatCredits(finance.outgoing)}</dd>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Net</dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--primary)]">{formatCredits(finance.net)}</dd>
            </div>
          </dl>
          <p className="text-xs text-[var(--muted)]">
            Includes opening balance, income, expenses, auction sales, refunds, and adjustments. Use tournament Finance for
            per-event detail.
          </p>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Squad overview</h2>
            <Link href="/organizer/tournaments" className="text-sm font-semibold text-[var(--primary)] hover:underline">
              Tournaments
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--muted)]">Players enrolled</span>
              <span className="font-semibold">{playerCount}</span>
            </li>
            <li className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--muted)]">Players sold</span>
              <span className="font-semibold text-[var(--success-text)]">{soldCount}</span>
            </li>
            <li className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="text-[var(--muted)]">Available / unsold</span>
              <span className="font-semibold">{playerCount - soldCount}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--muted)]">Teams registered</span>
              <span className="font-semibold">{teamCount}</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Your tournaments</h2>
          <Link href="/organizer/tournaments" className="text-sm font-semibold text-[var(--primary)] hover:underline">
            View all
          </Link>
        </div>
        {!tournaments?.length ? (
          <p className="text-sm text-[var(--muted)]">
            No tournaments assigned yet. Your administrator will create events for you — they will appear here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tournaments.slice(0, 5).map((t) => (
              <li key={t.id}>
                <TournamentListItem
                  href={`/organizer/tournaments/${t.id}`}
                  name={t.name}
                  status={t.status}
                  hint="Click to open this tournament"
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
