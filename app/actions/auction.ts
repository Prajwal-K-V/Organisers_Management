"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/utils/supabase/utility/auth";
import { redirectWithFlash } from "@/lib/flash";
import { buildPlayerSoldUpdate } from "@/lib/players";
import { ensureMyTournamentOrganizer } from "@/lib/ensure-tournament-organizer";
import { teamPurseRemaining, teamSpendFromPlayers } from "@/lib/team-roster";

async function getSupabase() {
  const { profile, supabase } = await requireOrganizer();
  return { supabase, profile };
}

function auctionPath(tournamentId: string) {
  return `/organizer/tournaments/${tournamentId}/auction`;
}

async function assignPlayerSaleClientSide(
  tournamentId: string,
  playerId: string,
  teamId: string,
  amount: number,
  path: string,
  supabase: Awaited<ReturnType<typeof getSupabase>>["supabase"],
  _profile: Awaited<ReturnType<typeof getSupabase>>["profile"]
) {
  const { data: player, error: playerFetchError } = await supabase
    .from("players")
    .select("id, status, base_price, tournament_id, name")
    .eq("id", playerId)
    .single();
  if (playerFetchError || !player || player.tournament_id !== tournamentId) {
    redirectWithFlash(path, "error", "Player not found.");
  }
  if (player.status === "sold") redirectWithFlash(path, "error", "This player is already sold.");
  if (amount < Number(player.base_price)) {
    redirectWithFlash(path, "error", `Bid must be at least ${player.base_price}.`);
  }

  const { data: team, error: teamFetchError } = await supabase
    .from("teams")
    .select("id, name, purse_total, tournament_id")
    .eq("id", teamId)
    .single();
  if (teamFetchError || !team || team.tournament_id !== tournamentId) {
    redirectWithFlash(path, "error", "Team not found.");
  }

  const { data: rosterPlayers } = await supabase
    .from("players")
    .select("team_id, sold_price")
    .eq("tournament_id", tournamentId);
  const remaining = teamPurseRemaining(team.purse_total, rosterPlayers ?? [], teamId);
  if (remaining < amount) {
    redirectWithFlash(path, "error", `${team.name} does not have enough purse remaining.`);
  }

  const { error: playerUpdateError } = await supabase
    .from("players")
    .update(buildPlayerSoldUpdate(teamId, amount))
    .eq("id", playerId);
  if (playerUpdateError) redirectWithFlash(path, "error", playerUpdateError.message);

  const spentAfter = teamSpendFromPlayers(rosterPlayers ?? [], teamId) + amount;
  const { error: teamUpdateError } = await supabase
    .from("teams")
    .update({ purse_remaining: Number(team.purse_total) - spentAfter })
    .eq("id", teamId);
  if (teamUpdateError) redirectWithFlash(path, "error", teamUpdateError.message);

  redirectWithFlash(path, "success", `${player.name} → ${team.name} for ${amount}.`);
}

/** Assign a player to a team for a fixed bid amount (no bid history / sessions). */
export async function assignPlayerSale(tournamentId: string, formData: FormData) {
  const path = auctionPath(tournamentId);
  try {
    const { supabase, profile } = await getSupabase();
    const linkErr = await ensureMyTournamentOrganizer(supabase, tournamentId);
    if (linkErr) redirectWithFlash(path, "error", linkErr);

    const playerId = String(formData.get("player_id") ?? "");
    const teamId = String(formData.get("team_id") ?? "");
    const amount = Number(formData.get("amount") ?? 0);

    if (!playerId || !teamId) redirectWithFlash(path, "error", "Select a player and a team.");
    if (Number.isNaN(amount) || amount <= 0) redirectWithFlash(path, "error", "Enter a valid bid amount.");

    const { error: rpcError } = await supabase.rpc("assign_player_sale", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
      p_team_id: teamId,
      p_amount: amount,
    });

    if (rpcError) {
      const missingRpc =
        rpcError.message.includes("Could not find the function") ||
        rpcError.code === "PGRST202";
      if (missingRpc) {
        await assignPlayerSaleClientSide(
          tournamentId,
          playerId,
          teamId,
          amount,
          path,
          supabase,
          profile
        );
        return;
      }
      redirectWithFlash(path, "error", rpcError.message);
    }

    revalidatePath(path);
    revalidatePath(`/organizer/tournaments/${tournamentId}/players`);
    revalidatePath(`/organizer/tournaments/${tournamentId}/teams`);
    revalidatePath(`/organizer/tournaments/${tournamentId}/finance`);

    const { data: player } = await supabase.from("players").select("name").eq("id", playerId).single();
    const { data: team } = await supabase.from("teams").select("name").eq("id", teamId).single();
    const label = player?.name && team?.name
      ? `${player.name} → ${team.name} for ${amount}.`
      : "Sale recorded.";
    redirectWithFlash(path, "success", label);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not complete sale.");
  }
}
