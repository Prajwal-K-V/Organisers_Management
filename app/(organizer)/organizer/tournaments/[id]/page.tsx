import Link from "next/link";
import { Card } from "@/components/ui/card";
import { TournamentStatusControl } from "@/components/tournament-status-control";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TournamentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireOrganizer();
  const { id } = await params;
  const supabase = createClient(await cookies());
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", profile.id)
    .single();

  const [{ count: teamCount }, { count: playerCount }] = await Promise.all([
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("tournament_id", id),
    supabase.from("players").select("*", { count: "exact", head: true }).eq("tournament_id", id),
  ]);

  const teams = teamCount ?? 0;
  const players = playerCount ?? 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[var(--accent-soft)]/80 to-white">
        <h2 className="font-semibold text-stone-900">Getting started</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700">
          <li className={teams > 0 ? "text-emerald-700" : ""}>
            {teams > 0 ? "✓" : "1."} Add teams with purse budgets
          </li>
          <li className={players > 0 ? "text-emerald-700" : ""}>
            {players > 0 ? "✓" : "2."} Register players and base prices
          </li>
          <li>Run the live auction and close lots</li>
          <li>Review finance and export the ledger</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/organizer/tournaments/${id}/teams`}>
            <Button variant="secondary">Teams</Button>
          </Link>
          <Link href={`/organizer/tournaments/${id}/players`}>
            <Button variant="secondary">Players</Button>
          </Link>
          <Link href={`/organizer/tournaments/${id}/auction`}>
            <Button>Auction room</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">Tournament status</p>
          <div className="mt-2">
            {tournament?.status ? (
              <TournamentStatusControl tournamentId={id} status={tournament.status} />
            ) : null}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">Teams</p>
          <p className="stat-value mt-2">{teams}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">Players</p>
          <p className="stat-value mt-2">{players}</p>
        </Card>
      </div>
    </div>
  );
}
