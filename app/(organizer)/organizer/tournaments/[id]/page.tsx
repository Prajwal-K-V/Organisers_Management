import { Card } from "@/components/ui/card";
import { TournamentSetupGuide } from "@/components/tournament-setup-guide";
import { TournamentStatusControl } from "@/components/tournament-status-control";
import { notFound } from "next/navigation";
import { fetchTournamentSquadCounts } from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TournamentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireOrganizer();
  const { id } = await params;
  const { data: tournament } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
  if (!tournament) notFound();

  const { teams, players } = await fetchTournamentSquadCounts(supabase, id);

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
    </div>
  );
}
