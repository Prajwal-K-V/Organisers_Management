import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { teamSpendFromPlayers } from "@/lib/team-roster";

export async function syncTeamPurseRemaining(
  supabase: SupabaseClient<Database>,
  tournamentId: string,
  teamId: string
) {
  // Fetch team budget and team's sold players in parallel (independent queries)
  const [{ data: team, error: teamError }, { data: soldPlayers, error: playersError }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("purse_total")
        .eq("id", teamId)
        .eq("tournament_id", tournamentId)
        .single(),
      supabase
        .from("players")
        .select("sold_price")
        .eq("tournament_id", tournamentId)
        .eq("team_id", teamId)
        .eq("status", "sold"),
    ]);

  if (teamError || !team) return teamError ?? new Error("Team not found");
  if (playersError) return playersError;

  const spent = (soldPlayers ?? []).reduce((s, p) => s + Number(p.sold_price ?? 0), 0);
  const { error: updateError } = await supabase
    .from("teams")
    .update({ purse_remaining: Number(team.purse_total) - spent })
    .eq("id", teamId)
    .eq("tournament_id", tournamentId);

  return updateError;
}
