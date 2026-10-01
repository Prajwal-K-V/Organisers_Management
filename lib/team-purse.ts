import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { teamSpendFromPlayers } from "@/lib/team-roster";

export async function syncTeamPurseRemaining(
  supabase: SupabaseClient<Database>,
  tournamentId: string,
  teamId: string
) {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("purse_total")
    .eq("id", teamId)
    .eq("tournament_id", tournamentId)
    .single();
  if (teamError || !team) return teamError ?? new Error("Team not found");

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("team_id, sold_price")
    .eq("tournament_id", tournamentId);
  if (playersError) return playersError;

  const spent = teamSpendFromPlayers(players ?? [], teamId);
  const { error: updateError } = await supabase
    .from("teams")
    .update({ purse_remaining: Number(team.purse_total) - spent })
    .eq("id", teamId)
    .eq("tournament_id", tournamentId);

  return updateError;
}
