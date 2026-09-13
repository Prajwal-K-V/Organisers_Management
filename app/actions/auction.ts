"use server";

import { requireOrganizer } from "@/utils/supabase/utility/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirectWithFlash } from "@/lib/flash";
import { buildPlayerSoldUpdate } from "@/lib/players";
import { teamPurseRemaining, teamSpendFromPlayers } from "@/lib/team-roster";

async function getSupabase() {
  const { profile } = await requireOrganizer();
  const cookieStore = await cookies();
  return { supabase: createClient(cookieStore), profile };
}

function auctionPath(tournamentId: string) {
  return `/organizer/tournaments/${tournamentId}/auction`;
}

/** Assign a player to a team for a fixed bid amount (no bid history / sessions). */
export async function assignPlayerSale(tournamentId: string, formData: FormData) {
  const path = auctionPath(tournamentId);
  try {
    const { supabase, profile } = await getSupabase();
    const playerId = String(formData.get("player_id") ?? "");
    const teamId = String(formData.get("team_id") ?? "");
    const amount = Number(formData.get("amount") ?? 0);

    if (!playerId || !teamId) redirectWithFlash(path, "error", "Select a player and a team.");
    if (Number.isNaN(amount) || amount <= 0) redirectWithFlash(path, "error", "Enter a valid bid amount.");

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
    await supabase
      .from("teams")
      .update({ purse_remaining: Number(team.purse_total) - spentAfter })
      .eq("id", teamId);

    await supabase.from("financial_ledger").insert({
      tournament_id: tournamentId,
      team_id: teamId,
      entry_type: "bid",
      amount: -amount,
      description: `${player.name} sold to ${team.name}`,
      created_by: profile.id,
    });

    redirectWithFlash(path, "success", `${player.name} → ${team.name} for ${amount}.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not complete sale.");
  }
}
