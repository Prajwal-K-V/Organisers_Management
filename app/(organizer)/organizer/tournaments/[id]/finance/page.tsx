import { FinanceManager } from "@/components/finance-manager";
import { isAuctionLedgerEntry } from "@/lib/ledger";
import { getCanDeleteLedgerForTournament } from "@/lib/tournament-organizer";
import { fetchOrganizerTeams } from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, profile } = await requireOrganizer();
  const { id: tournamentId } = await params;

  const [teams, { data: ledger }, { data: history }] = await Promise.all([
    fetchOrganizerTeams(supabase, tournamentId),
    supabase
      .from("financial_ledger")
      .select(
        "*, creator:profiles!financial_ledger_created_by_fkey(full_name, email)"
      )
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_ledger_history")
      .select(
        "*, editor:profiles!financial_ledger_history_changed_by_fkey(full_name, email)"
      )
      .eq("tournament_id", tournamentId)
      .order("changed_at", { ascending: false }),
  ]);

  const financeLedger = (ledger ?? []).filter((row) => !isAuctionLedgerEntry(row.entry_type));

  const historyByLedgerId: Record<string, NonNullable<typeof history>> = {};
  for (const row of history ?? []) {
    const list = historyByLedgerId[row.ledger_id] ?? [];
    list.push(row);
    historyByLedgerId[row.ledger_id] = list;
  }

  const csvRows = [
    ["date", "type", "team_id", "amount", "added_by", "description"].join(","),
    ...financeLedger.map((row) => {
      const addedBy =
        row.creator?.full_name?.trim() || row.creator?.email || "";
      return [
        row.created_at,
        row.entry_type,
        row.team_id ?? "",
        row.amount,
        `"${addedBy}"`,
        `"${row.description ?? ""}"`,
      ].join(",");
    }),
  ].join("\n");

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows)}`;
  const canDeleteLedger = await getCanDeleteLedgerForTournament(supabase, tournamentId, profile.id);

  return (
    <FinanceManager
      tournamentId={tournamentId}
      teams={teams}
      ledger={financeLedger}
      historyByLedgerId={historyByLedgerId}
      canDeleteLedger={canDeleteLedger}
      csvHref={csvHref}
    />
  );
}
