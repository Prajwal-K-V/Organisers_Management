import { FinanceManager } from "@/components/finance-manager";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  await requireOrganizer();
  const { id: tournamentId } = await params;
  const supabase = createClient(await cookies());

  const [{ data: teams }, { data: ledger }] = await Promise.all([
    supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name"),
    supabase
      .from("financial_ledger")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false }),
  ]);

  const csvRows = [
    ["date", "type", "team_id", "amount", "description"].join(","),
    ...(ledger ?? []).map((row) =>
      [row.created_at, row.entry_type, row.team_id ?? "", row.amount, `"${row.description ?? ""}"`].join(",")
    ),
  ].join("\n");

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows)}`;

  return (
    <FinanceManager
      tournamentId={tournamentId}
      teams={teams ?? []}
      ledger={ledger ?? []}
      csvHref={csvHref}
    />
  );
}
