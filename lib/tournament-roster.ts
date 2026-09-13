import type { Player, Team } from "@/types/database";
import { buildTeamRosterExport, type TeamRosterExport } from "@/lib/team-roster";

export function buildAllTeamRosters(
  tournamentName: string,
  teams: Team[],
  players: Player[]
): TeamRosterExport[] {
  return teams.map((team) => buildTeamRosterExport(tournamentName, team, players));
}
