import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamRosterPdfButtons } from "@/components/team-roster-pdf-buttons";
import { TeamSquadTable } from "@/components/team-squad-table";
import { Card } from "@/components/ui/card";
import {
  buildTeamRosterExport,
  playersForTeam,
  squadSpend,
  teamPurseRemaining,
  toRosterPlayer,
} from "@/lib/team-roster";
import {
  fetchOrganizerPlayerRosterBits,
  fetchOrganizerPlayers,
  fetchOrganizerTeams,
} from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TeamDetailViewPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { supabase } = await requireOrganizer();
  const { id: tournamentId, teamId } = await params;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) notFound();

  const [teams, allPlayerRows] = await Promise.all([
    fetchOrganizerTeams(supabase, tournamentId),
    fetchOrganizerPlayers(supabase, tournamentId),
  ]);
  const team = teams.find((t) => t.id === teamId);
  if (!team) notFound();

  const squadPlayers = allPlayerRows.filter((p) => p.team_id === teamId);
  const allPlayers = await fetchOrganizerPlayerRosterBits(supabase, tournamentId);

  const squadReturnTo = `/organizer/tournaments/${tournamentId}/team-view/${teamId}`;

  const squad = (squadPlayers ?? []).map(toRosterPlayer);
  const spent = squadSpend(squad);
  const remaining = teamPurseRemaining(team.purse_total, allPlayers ?? [], teamId);
  const roster = buildTeamRosterExport(tournament.name, team, squadPlayers ?? []);

  return (
    <div className="space-y-6">
      <Link
        href={`/organizer/tournaments/${tournamentId}/team-view`}
        className="text-sm font-medium text-[var(--primary)] hover:underline"
      >
        ← All teams
      </Link>

      <Card className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">
              {tournament.name}
            </p>
            <h2 className="text-2xl font-bold">{team.name}</h2>
          </div>
          <TeamRosterPdfButtons roster={roster} layout="stack" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Purse total</p>
            <p className="stat-value text-xl">{team.purse_total}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Spent on squad</p>
            <p className="stat-value text-xl">{spent}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Remaining</p>
            <p className="stat-value text-xl text-[var(--primary)]">{remaining}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Players</p>
            <p className="stat-value text-xl">{squad.length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Squad</h3>
        <TeamSquadTable
          tournamentId={tournamentId}
          players={squadPlayers ?? []}
          teams={teams ?? []}
          returnTo={squadReturnTo}
        />
      </Card>
    </div>
  );
}
