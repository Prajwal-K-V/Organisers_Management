import { FinanceManager } from "@/components/finance-manager";
import { isAuctionLedgerEntry } from "@/lib/ledger";
import { enrichLedgerCreators, enrichLedgerHistoryEditors } from "@/lib/ledger-profiles";
import { getCanDeleteLedgerForTournament } from "@/lib/tournament-organizer";
import { fetchOrganizerTeams } from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";
import type { FinancialLedgerEntryWithCreator, FinancialLedgerHistoryWithEditor } from "@/types/database";

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, profile } = await requireOrganizer();
  const { id: tournamentId } = await params;

  const [teams, { data: ledger }, { data: history }] = await Promise.all([
    fetchOrganizerTeams(supabase, tournamentId),
    supabase
      .from("financial_ledger")
      .select("*, creator:profiles!created_by(full_name, email)")
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_ledger_history")
      .select("*, editor:profiles!changed_by(full_name, email)")
      .eq("tournament_id", tournamentId)
      .order("changed_at", { ascending: false }),
  ]);

  const creatorIds = [
    ...new Set(
      (ledger ?? [])
        .map((row) => row.created_by)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const editorIds = [
    ...new Set(
      (history ?? [])
        .map((row) => row.changed_by)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const profileIds = [...new Set([...creatorIds, ...editorIds])];
  const { data: profileRows } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", profileIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const profileById = new Map((profileRows ?? []).map((p) => [p.id, p]));

  let financeLedger = (ledger ?? []).filter((row) => !isAuctionLedgerEntry(row.entry_type)) as FinancialLedgerEntryWithCreator[];
  financeLedger = financeLedger.map((row) => {
    if (row.creator?.full_name?.trim() || row.creator?.email) return row;
    const fromLookup = row.created_by ? profileById.get(row.created_by) : undefined;
    if (fromLookup) {
      return { ...row, creator: { full_name: fromLookup.full_name, email: fromLookup.email } };
    }
    return row;
  });
  financeLedger = enrichLedgerCreators(financeLedger, profile);

  let historyRows = (history ?? []) as FinancialLedgerHistoryWithEditor[];
  historyRows = historyRows.map((row) => {
    if (row.editor?.full_name?.trim() || row.editor?.email) return row;
    const fromLookup = row.changed_by ? profileById.get(row.changed_by) : undefined;
    if (fromLookup) {
      return { ...row, editor: { full_name: fromLookup.full_name, email: fromLookup.email } };
    }
    return row;
  });
  historyRows = enrichLedgerHistoryEditors(historyRows, profile);

  const historyByLedgerId: Record<string, FinancialLedgerHistoryWithEditor[]> = {};
  for (const row of historyRows) {
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
