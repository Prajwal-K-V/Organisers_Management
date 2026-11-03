import { Card } from "@/components/ui/card";
import { TournamentSetupGuide } from "@/components/tournament-setup-guide";
import { TournamentStatusControl } from "@/components/tournament-status-control";
import { PersonFinanceBreakdown } from "@/components/person-finance-breakdown";
import type { PersonFinanceRow } from "@/components/person-finance-breakdown";
import { notFound } from "next/navigation";
import { fetchTournamentSquadCounts } from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";
import { ledgerEntryTone } from "@/lib/ledger";
import type { LedgerEntryType } from "@/types/database";

export default async function TournamentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireOrganizer();
  const { id } = await params;
  const [{ data: tournament }, { teams, players }, { data: ledgerRows }] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
    fetchTournamentSquadCounts(supabase, id),
    supabase
      .from("financial_ledger")
      .select("entry_type, amount, payment_mode, received_by_name, status")
      .eq("tournament_id", id)
      .neq("entry_type", "bid"),
  ]);
  if (!tournament) notFound();

  const personMap = new Map<string, PersonFinanceRow>();
  for (const row of ledgerRows ?? []) {
    if (row.status === "pending") continue;
    const tone = ledgerEntryTone(row.entry_type as LedgerEntryType, row.amount);
    if (tone === "neutral") continue;
    const key = row.received_by_name?.trim() || "__unassigned__";
    const label = key === "__unassigned__" ? "Unassigned" : key;
    if (!personMap.has(key)) {
      personMap.set(key, { name: label, cashIn: 0, phonePeIn: 0, totalIn: 0, paidOut: 0 });
    }
    const p = personMap.get(key)!;
    const amt = Math.abs(row.amount);
    if (tone === "income") {
      p.totalIn += amt;
      if (row.payment_mode === "cash") p.cashIn += amt;
      else if (row.payment_mode === "phonepe") p.phonePeIn += amt;
    } else {
      p.paidOut += amt;
    }
  }

  const personRows: PersonFinanceRow[] = [...personMap.entries()]
    .sort(([aKey, a], [bKey, b]) => {
      if (aKey === "__unassigned__") return 1;
      if (bKey === "__unassigned__") return -1;
      return b.totalIn - a.totalIn;
    })
    .map(([, row]) => row);

  return (
    <div className="space-y-6">
      <TournamentSetupGuide tournamentId={id} teams={teams} players={players} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Tournament status</p>
          <div className="mt-3">
            {tournament?.status ? (
              <TournamentStatusControl tournamentId={id} status={tournament.status} />
            ) : null}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Teams</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{teams}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Players</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{players}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Status</p>
          <p className="mt-2 text-lg font-semibold capitalize text-stone-800">{tournament.status}</p>
        </Card>
      </div>

      <PersonFinanceBreakdown rows={personRows} />
    </div>
  );
}
