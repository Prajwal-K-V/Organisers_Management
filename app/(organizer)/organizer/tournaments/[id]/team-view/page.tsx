import Link from "next/link";
import { TeamRosterPdfButtons } from "@/components/team-roster-pdf-buttons";
import { EmptyState } from "@/components/empty-state";
import { TableWrap } from "@/components/table-wrap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildAllTeamRosters } from "@/lib/tournament-roster";
import {
  buildTeamRosterExport,
  playersForTeam,
  squadSpend,
  teamPurseRemaining,
  toRosterPlayer,
} from "@/lib/team-roster";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TeamViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrganizer();
  const { id: tournamentId } = await params;
  const supabase = createClient(await cookies());

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", tournamentId)
    .eq("organizer_id", profile.id)
    .single();

  if (!tournament) return null;

  const [{ data: teams }, { data: players }] = await Promise.all([
    supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name"),
    supabase.from("players").select("*").eq("tournament_id", tournamentId).order("player_code"),
  ]);

  const allRosters = buildAllTeamRosters(tournament.name, teams ?? [], players ?? []);

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Team view</h2>
          <p className="text-sm text-[var(--muted)]">
            Squad lists, purse summary, and PDF export for each team or the full tournament.
          </p>
        </div>
        {teams?.length ? (
          <TeamRosterPdfButtons allRosters={allRosters} tournamentName={tournament.name} />
        ) : null}
      </Card>

      {!teams?.length ? (
        <EmptyState title="No teams" description="Add teams first to view squads and export PDFs." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => {
              const squad = playersForTeam(players ?? [], team.id).map(toRosterPlayer);
              const spent = squadSpend(squad);
              const roster = buildTeamRosterExport(tournament.name, team, players ?? []);
              return (
                <Card key={team.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{team.name}</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {squad.length} players · spent {spent} · {teamPurseRemaining(team.purse_total, players ?? [], team.id)} left
                      </p>
                    </div>
                    <Link href={`/organizer/tournaments/${tournamentId}/team-view/${team.id}`}>
                      <Button variant="secondary">Open</Button>
                    </Link>
                  </div>
                  <TeamRosterPdfButtons roster={roster} layout="stack" />
                </Card>
              );
            })}
          </div>

          <Card className="hidden md:block">
            <TableWrap>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Players</th>
                    <th>Purse total</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const squad = playersForTeam(players ?? [], team.id);
                    const spent = squadSpend(squad.map(toRosterPlayer));
                    return (
                      <tr key={team.id}>
                        <td className="font-medium">{team.name}</td>
                        <td>{squad.length}</td>
                        <td>{team.purse_total}</td>
                        <td>{spent}</td>
                        <td>{teamPurseRemaining(team.purse_total, players ?? [], team.id)}</td>
                        <td>
                          <Link
                            href={`/organizer/tournaments/${tournamentId}/team-view/${team.id}`}
                            className="text-sm font-semibold text-[var(--primary)] hover:underline"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}
    </div>
  );
}
