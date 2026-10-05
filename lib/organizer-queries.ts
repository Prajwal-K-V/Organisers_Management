import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Player, Team, Tournament } from "@/types/database";

function isMissingRpc(error: { message?: string } | null) {
  const msg = error?.message ?? "";
  return msg.includes("Could not find the function") || msg.includes("schema cache");
}

export async function fetchOrganizerTournaments(
  supabase: SupabaseClient<Database>
): Promise<Tournament[]> {
  const { data, error } = await supabase.rpc("organizer_my_tournaments");
  if (!error) return data ?? [];
  if (isMissingRpc(error)) {
    const { data: rows } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });
    return rows ?? [];
  }
  return [];
}

export async function fetchOrganizerTeams(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<Team[]> {
  const { data: rows, error: tableError } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("name");
  if (!tableError) return rows ?? [];

  const { data, error } = await supabase.rpc("organizer_tournament_teams", {
    p_tournament_id: tournamentId,
  });
  if (!error) return data ?? [];
  if (isMissingRpc(error)) return rows ?? [];
  return [];
}

export async function fetchOrganizerPlayers(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<Player[]> {
  const { data: rows, error: tableError } = await supabase
    .from("players")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("player_code");
  if (!tableError) return rows ?? [];

  const { data, error } = await supabase.rpc("organizer_tournament_players", {
    p_tournament_id: tournamentId,
  });
  if (!error) return data ?? [];
  if (isMissingRpc(error)) return rows ?? [];
  return [];
}

export async function fetchOrganizerPlayerRosterBits(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<Pick<Player, "team_id" | "sold_price">[]> {
  const { data } = await supabase
    .from("players")
    .select("team_id, sold_price")
    .eq("tournament_id", tournamentId);
  return data ?? [];
}

export type OrganizerSquadSummary = {
  teamCount: number;
  playerCount: number;
  soldCount: number;
};

/** One round-trip for dashboard stats across many tournaments (replaces per-tournament RPC fan-out). */
export async function fetchOrganizerSquadSummary(
  supabase: SupabaseClient<Database>,
  tournamentIds: string[]
): Promise<OrganizerSquadSummary> {
  if (!tournamentIds.length) {
    return { teamCount: 0, playerCount: 0, soldCount: 0 };
  }

  const [teamsRes, playersRes, soldRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .in("tournament_id", tournamentIds),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .in("tournament_id", tournamentIds),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .in("tournament_id", tournamentIds)
      .eq("status", "sold"),
  ]);

  return {
    teamCount: teamsRes.count ?? 0,
    playerCount: playersRes.count ?? 0,
    soldCount: soldRes.count ?? 0,
  };
}

/** Count-only fetch for tournament overview cards. */
export async function fetchTournamentSquadCounts(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<{ teams: number; players: number }> {
  const [teamsRes, playersRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId),
  ]);
  return {
    teams: teamsRes.count ?? 0,
    players: playersRes.count ?? 0,
  };
}
