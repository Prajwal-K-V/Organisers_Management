"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/utils/supabase/utility/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { redirectWithFlash } from "@/lib/flash";
import { buildPlayerInsertRow, nextPlayerCodeFromExisting } from "@/lib/players";
import type { TournamentStatus } from "@/types/database";

async function getSupabase() {
  const { profile } = await requireOrganizer();
  const cookieStore = await cookies();
  return { supabase: createClient(cookieStore), profile };
}

function tournamentBase(id: string) {
  return `/organizer/tournaments/${id}`;
}

export async function updateTournamentStatus(tournamentId: string, formData: FormData) {
  const path = tournamentBase(tournamentId);
  const next = String(formData.get("status") ?? "") as TournamentStatus;
  if (!["draft", "published", "completed"].includes(next)) {
    redirectWithFlash(path, "error", "Invalid status.");
  }
  try {
    const { supabase } = await getSupabase();
    const { data: current } = await supabase
      .from("tournaments")
      .select("status")
      .eq("id", tournamentId)
      .single();
    if (!current) redirectWithFlash(path, "error", "Tournament not found.");

    const ok =
      (current.status === "draft" && next === "published") ||
      (current.status === "published" && next === "completed");
    if (!ok) redirectWithFlash(path, "error", "That status change is not allowed.");

    const { error } = await supabase.from("tournaments").update({ status: next }).eq("id", tournamentId);
    if (error) redirectWithFlash(path, "error", error.message);

    const message =
      next === "published"
        ? "Tournament is now live."
        : next === "completed"
          ? "Tournament marked completed."
          : "Status updated.";
    redirectWithFlash(path, "success", message);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not update status.");
  }
}

export async function createTeam(tournamentId: string, formData: FormData) {
  const path = `${tournamentBase(tournamentId)}/teams`;
  try {
    const { supabase } = await getSupabase();
    const name = String(formData.get("name") ?? "").trim();
    const purse = Number(formData.get("purse_total") ?? 0);
    if (!name) redirectWithFlash(path, "error", "Team name is required.");
    if (Number.isNaN(purse) || purse < 0) redirectWithFlash(path, "error", "Enter a valid purse amount.");
    const { error } = await supabase
      .from("teams")
      .insert({ tournament_id: tournamentId, name, purse_total: purse, purse_remaining: purse });
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", `Team “${name}” added.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not add team.");
  }
}

export async function createPlayer(tournamentId: string, formData: FormData) {
  const path = `${tournamentBase(tournamentId)}/players`;
  try {
    const { supabase } = await getSupabase();
    const name = String(formData.get("name") ?? "").trim();
    const basePrice = Number(formData.get("base_price") ?? 0);
    const role = String(formData.get("role") ?? "");
    if (!name) redirectWithFlash(path, "error", "Player name is required.");
    const { data: existingCodes } = await supabase
      .from("players")
      .select("player_code")
      .eq("tournament_id", tournamentId);
    const playerCode = nextPlayerCodeFromExisting(
      (existingCodes ?? []).map((row) => row.player_code).filter(Boolean) as string[]
    );
    const { error } = await supabase.from("players").insert(
      buildPlayerInsertRow({
        tournamentId,
        name,
        playerCode,
        basePrice,
        role,
      })
    );
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", `Player “${name}” added.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not add player.");
  }
}

export async function deleteTeam(tournamentId: string, teamId: string) {
  const path = `${tournamentBase(tournamentId)}/teams`;
  try {
    const { supabase } = await getSupabase();
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Team removed.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not delete team.");
  }
}

export async function deletePlayer(tournamentId: string, playerId: string) {
  const path = `${tournamentBase(tournamentId)}/players`;
  try {
    const { supabase } = await getSupabase();
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Player removed.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not delete player.");
  }
}

export async function addLedgerEntry(tournamentId: string, formData: FormData) {
  const path = `${tournamentBase(tournamentId)}/finance`;
  try {
    const { supabase, profile } = await getSupabase();
    const teamId = String(formData.get("team_id") ?? "") || null;
    const entryType = String(formData.get("entry_type") ?? "adjustment") as
      | "adjustment"
      | "income"
      | "expense"
      | "refund";
    const amount = Number(formData.get("amount") ?? 0);
    const description = String(formData.get("description") ?? "").trim();
    const { error } = await supabase.from("financial_ledger").insert({
      tournament_id: tournamentId,
      team_id: teamId,
      entry_type: entryType,
      amount,
      description: description || null,
      created_by: profile.id,
    });
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Ledger entry saved.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not save entry.");
  }
}
