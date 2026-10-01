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
  const { data, error } = await supabase.rpc("organizer_tournament_teams", {
    p_tournament_id: tournamentId,
  });
  if (!error) return data ?? [];
  if (isMissingRpc(error)) {
    const { data: rows } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name");
    return rows ?? [];
  }
  return [];
}

export async function fetchOrganizerPlayers(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<Player[]> {
  const { data, error } = await supabase.rpc("organizer_tournament_players", {
    p_tournament_id: tournamentId,
  });
  if (!error) return data ?? [];
  if (isMissingRpc(error)) {
    const { data: rows } = await supabase
      .from("players")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("player_code");
    return rows ?? [];
  }
  return [];
}

export async function fetchOrganizerPlayerRosterBits(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<Pick<Player, "team_id" | "sold_price">[]> {
  const players = await fetchOrganizerPlayers(supabase, tournamentId);
  return players.map((p) => ({ team_id: p.team_id, sold_price: p.sold_price }));
}
