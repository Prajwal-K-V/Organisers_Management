import type { Player, Team } from "@/types/database";

export type TeamRosterPlayer = {
  playerCode: string;
  name: string;
  role: string;
  basePrice: number;
  soldPrice: number | null;
};

export type TeamRosterExport = {
  tournamentName: string;
  teamName: string;
  purseTotal: number;
  purseRemaining: number;
  players: TeamRosterPlayer[];
};

export function playersForTeam(players: Player[], teamId: string): Player[] {
  return players.filter((p) => p.team_id === teamId);
}

/** Auction spend only — not finance ledger or opening balances. */
type PlayerPurseSlice = Pick<Player, "team_id" | "sold_price">;

export function teamSpendFromPlayers(players: PlayerPurseSlice[], teamId: string): number {
  return players
    .filter((p) => p.team_id === teamId)
    .reduce((sum, p) => sum + Number(p.sold_price ?? 0), 0);
}

export function teamPurseRemaining(purseTotal: number, players: PlayerPurseSlice[], teamId: string): number {
  return Number(purseTotal) - teamSpendFromPlayers(players, teamId);
}

export function toRosterPlayer(player: Player): TeamRosterPlayer {
  return {
    playerCode: player.player_code ?? "—",
    name: player.name,
    role: player.role?.replace(/_/g, " ") ?? "—",
    basePrice: Number(player.base_price),
    soldPrice: player.sold_price != null ? Number(player.sold_price) : null,
  };
}

export function buildTeamRosterExport(
  tournamentName: string,
  team: Pick<Team, "id" | "name" | "purse_total" | "purse_remaining">,
  allPlayers: Player[]
): TeamRosterExport {
  const squad = playersForTeam(allPlayers, team.id).map(toRosterPlayer);
  return {
    tournamentName,
    teamName: team.name,
    purseTotal: Number(team.purse_total),
    purseRemaining: teamPurseRemaining(team.purse_total, allPlayers, team.id),
    players: squad.sort((a, b) => a.playerCode.localeCompare(b.playerCode)),
  };
}

export function squadSpend(players: TeamRosterPlayer[]): number {
  return players.reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);
}

export function pdfFileName(roster: TeamRosterExport): string {
  const safe = (s: string) =>
    s
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 48);
  return `${safe(roster.tournamentName)}-${safe(roster.teamName)}-roster.pdf`;
}
