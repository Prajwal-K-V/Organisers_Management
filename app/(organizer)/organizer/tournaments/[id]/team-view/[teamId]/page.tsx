import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamRosterPdfButtons } from "@/components/team-roster-pdf-buttons";
import { TableWrap } from "@/components/table-wrap";
import { Card } from "@/components/ui/card";
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

export default async function TeamDetailViewPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { profile } = await requireOrganizer();
  const { id: tournamentId, teamId } = await params;
  const supabase = createClient(await cookies());

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", tournamentId)
    .eq("organizer_id", profile.id)
    .single();

  if (!tournament) notFound();

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("tournament_id", tournamentId)
    .single();

  if (!team) notFound();

  const [{ data: squadPlayers }, { data: allPlayers }] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("team_id", teamId)
      .order("player_code"),
    supabase.from("players").select("team_id, sold_price").eq("tournament_id", tournamentId),
  ]);

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
        {!squad.length ? (
          <p className="text-sm text-[var(--muted)]">No players assigned to this team yet.</p>
        ) : (
          <TableWrap>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Base</th>
                  <th>Sold for</th>
                </tr>
              </thead>
              <tbody>
                {squad.map((p, i) => (
                  <tr key={`${p.playerCode}-${i}`}>
                    <td className="text-[var(--muted)]">{p.playerCode}</td>
                    <td className="font-medium">{p.name}</td>
                    <td className="capitalize">{p.role}</td>
                    <td>{p.basePrice}</td>
                    <td>{p.soldPrice ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
