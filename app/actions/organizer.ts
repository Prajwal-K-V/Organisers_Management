"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/utils/supabase/utility/auth";
import { redirect } from "next/navigation";
import { redirectWithFlash } from "@/lib/flash";
import {
  buildPlayerInsertRow,
  nextPlayerCodeFromExisting,
  normalizePlayingRole,
} from "@/lib/players";
import { syncTeamPurseRemaining } from "@/lib/team-purse";
import { teamPurseRemaining, teamSpendFromPlayers } from "@/lib/team-roster";
import { isDeletableLedgerEntry, isEditableLedgerEntry, MANUAL_LEDGER_FORM_TYPES } from "@/lib/ledger";
import { ensureMyTournamentOrganizer } from "@/lib/ensure-tournament-organizer";
import { getCanDeleteLedgerForTournament } from "@/lib/tournament-organizer";
import type { TournamentStatus } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function getSupabase() {
  const { profile, supabase } = await requireOrganizer();
  return { supabase, profile };
}

function tournamentBase(id: string) {
  return `/organizer/tournaments/${id}`;
}

async function prepareTournamentWrite(
  supabase: SupabaseClient<Database>,
  tournamentId: string,
  path: string
) {
  const err = await ensureMyTournamentOrganizer(supabase, tournamentId);
  if (err) redirectWithFlash(path, "error", err.message);
}

export async function updateTournamentStatus(tournamentId: string, formData: FormData) {
  const path = tournamentBase(tournamentId);
  const next = String(formData.get("status") ?? "") as TournamentStatus;
  if (!["draft", "published", "completed"].includes(next)) {
    redirectWithFlash(path, "error", "Invalid status.");
  }
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
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

    revalidatePath(path);
    revalidatePath("/organizer/tournaments");
    revalidatePath("/organizer/dashboard");

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
    await prepareTournamentWrite(supabase, tournamentId, path);
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
    await prepareTournamentWrite(supabase, tournamentId, path);
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

export async function updateTeam(tournamentId: string, teamId: string, formData: FormData) {
  const path = `${tournamentBase(tournamentId)}/teams`;
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
    const name = String(formData.get("name") ?? "").trim();
    const purse = Number(formData.get("purse_total") ?? 0);
    if (!name) redirectWithFlash(path, "error", "Team name is required.");
    if (Number.isNaN(purse) || purse < 0) redirectWithFlash(path, "error", "Enter a valid purse amount.");

    const { data: squad } = await supabase
      .from("players")
      .select("team_id, sold_price")
      .eq("tournament_id", tournamentId)
      .eq("team_id", teamId);
    const spent = teamSpendFromPlayers(squad ?? [], teamId);
    if (purse < spent) {
      redirectWithFlash(
        path,
        "error",
        `Purse must be at least ${spent} (already spent on players).`
      );
    }

    const { error } = await supabase
      .from("teams")
      .update({
        name,
        purse_total: purse,
        purse_remaining: purse - spent,
      })
      .eq("id", teamId)
      .eq("tournament_id", tournamentId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", `Team “${name}” updated.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not update team.");
  }
}

export async function deleteTeam(tournamentId: string, teamId: string) {
  const path = `${tournamentBase(tournamentId)}/teams`;
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Team removed.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not delete team.");
  }
}

export async function updatePlayer(tournamentId: string, playerId: string, formData: FormData) {
  const path = `${tournamentBase(tournamentId)}/players`;
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
    const name = String(formData.get("name") ?? "").trim();
    const basePrice = Number(formData.get("base_price") ?? 0);
    const role = String(formData.get("role") ?? "");
    if (!name) redirectWithFlash(path, "error", "Player name is required.");

    const { data: player } = await supabase
      .from("players")
      .select("status")
      .eq("id", playerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!player) redirectWithFlash(path, "error", "Player not found.");

    if (player.status === "sold") {
      const { error } = await supabase
        .from("players")
        .update({ name, role: normalizePlayingRole(role) })
        .eq("id", playerId)
        .eq("tournament_id", tournamentId);
      if (error) redirectWithFlash(path, "error", error.message);
      redirectWithFlash(path, "success", `Player “${name}” updated.`);
    }

    if (Number.isNaN(basePrice) || basePrice < 0) {
      redirectWithFlash(path, "error", "Enter a valid base price.");
    }
    const { error } = await supabase
      .from("players")
      .update({
        name,
        role: normalizePlayingRole(role),
        base_price: basePrice,
      })
      .eq("id", playerId)
      .eq("tournament_id", tournamentId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", `Player “${name}” updated.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not update player.");
  }
}

function resolveReturnPath(tournamentId: string, formData: FormData | undefined, fallback: string) {
  const raw = String(formData?.get("return_to") ?? "").trim();
  if (!raw) return fallback;
  if (!raw.startsWith(`/organizer/tournaments/${tournamentId}`)) return fallback;
  return raw;
}

function revalidatePlayerRosterPaths(tournamentId: string) {
  revalidatePath(`/organizer/tournaments/${tournamentId}/players`);
  revalidatePath(`/organizer/tournaments/${tournamentId}/teams`);
  revalidatePath(`/organizer/tournaments/${tournamentId}/team-view`);
  revalidatePath(`/organizer/tournaments/${tournamentId}/auction`);
  revalidatePath(`/organizer/tournaments/${tournamentId}/finance`);
}

export async function releasePlayerFromTeam(
  tournamentId: string,
  playerId: string,
  formData?: FormData
) {
  const path = resolveReturnPath(
    tournamentId,
    formData,
    `${tournamentBase(tournamentId)}/players`
  );
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);

    const { data: player } = await supabase
      .from("players")
      .select("id, name, status, team_id, sold_price")
      .eq("id", playerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!player) redirectWithFlash(path, "error", "Player not found.");
    if (player.status !== "sold" || !player.team_id) {
      redirectWithFlash(path, "error", "This player is not on a team.");
    }

    const oldTeamId = player.team_id;

    const { error: playerError } = await supabase
      .from("players")
      .update({ status: "available", team_id: null, sold_price: null })
      .eq("id", playerId)
      .eq("tournament_id", tournamentId);
    if (playerError) redirectWithFlash(path, "error", playerError.message);

    const purseError = await syncTeamPurseRemaining(supabase, tournamentId, oldTeamId);
    if (purseError) redirectWithFlash(path, "error", purseError.message);

    revalidatePlayerRosterPaths(tournamentId);
    redirectWithFlash(path, "success", `${player.name} removed from team and returned to the pool.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not release player from team.");
  }
}

export async function movePlayerToTeam(tournamentId: string, playerId: string, formData: FormData) {
  const path = resolveReturnPath(
    tournamentId,
    formData,
    `${tournamentBase(tournamentId)}/players`
  );
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);

    const newTeamId = String(formData.get("team_id") ?? "");
    if (!newTeamId) redirectWithFlash(path, "error", "Select a team.");

    const { data: player } = await supabase
      .from("players")
      .select("id, name, status, team_id, sold_price")
      .eq("id", playerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!player) redirectWithFlash(path, "error", "Player not found.");
    if (player.status !== "sold" || !player.team_id) {
      redirectWithFlash(path, "error", "Only squad players can be moved.");
    }
    if (player.team_id === newTeamId) {
      redirectWithFlash(path, "error", "Player is already on that team.");
    }

    const amount = Number(player.sold_price ?? 0);
    if (amount <= 0) redirectWithFlash(path, "error", "Invalid sale amount on player.");

    const oldTeamId = player.team_id;

    const { data: rosterPlayers } = await supabase
      .from("players")
      .select("team_id, sold_price")
      .eq("tournament_id", tournamentId);

    const { data: newTeam } = await supabase
      .from("teams")
      .select("id, name, purse_total")
      .eq("id", newTeamId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!newTeam) redirectWithFlash(path, "error", "Team not found.");

    const remaining = teamPurseRemaining(newTeam.purse_total, rosterPlayers ?? [], newTeamId);
    if (remaining < amount) {
      redirectWithFlash(path, "error", `${newTeam.name} does not have enough purse for this transfer.`);
    }

    const { error: playerError } = await supabase
      .from("players")
      .update({ team_id: newTeamId })
      .eq("id", playerId)
      .eq("tournament_id", tournamentId);
    if (playerError) redirectWithFlash(path, "error", playerError.message);

    const oldPurseError = await syncTeamPurseRemaining(supabase, tournamentId, oldTeamId);
    if (oldPurseError) redirectWithFlash(path, "error", oldPurseError.message);
    const newPurseError = await syncTeamPurseRemaining(supabase, tournamentId, newTeamId);
    if (newPurseError) redirectWithFlash(path, "error", newPurseError.message);

    revalidatePlayerRosterPaths(tournamentId);
    redirectWithFlash(path, "success", `${player.name} moved to ${newTeam.name}.`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not move player.");
  }
}

export async function deletePlayer(tournamentId: string, playerId: string) {
  const path = `${tournamentBase(tournamentId)}/players`;
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
    const { data: player } = await supabase
      .from("players")
      .select("status")
      .eq("id", playerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!player) redirectWithFlash(path, "error", "Player not found.");
    if (player.status === "sold") {
      redirectWithFlash(path, "error", "Sold players cannot be deleted.");
    }
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Player removed.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not delete player.");
  }
}

type ManualLedgerFormValues = {
  teamId: string | null;
  entryType: (typeof MANUAL_LEDGER_FORM_TYPES)[number] | "opening_balance";
  amount: number;
  description: string | null;
};

function parseManualLedgerForm(
  formData: FormData,
  options?: { allowOpeningBalance?: boolean }
): { ok: true; value: ManualLedgerFormValues } | { ok: false; message: string } {
  const teamId = String(formData.get("team_id") ?? "") || null;
  const entryType = String(formData.get("entry_type") ?? "adjustment");
  const amount = Number(formData.get("amount") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const allowed = options?.allowOpeningBalance
    ? [...MANUAL_LEDGER_FORM_TYPES, "opening_balance"]
    : MANUAL_LEDGER_FORM_TYPES;
  if (!allowed.includes(entryType as (typeof allowed)[number])) {
    return { ok: false, message: "Invalid entry type." };
  }
  if (!Number.isFinite(amount)) {
    return { ok: false, message: "Invalid amount." };
  }
  return {
    ok: true,
    value: {
      teamId,
      entryType: entryType as ManualLedgerFormValues["entryType"],
      amount,
      description: description || null,
    },
  };
}

export async function addLedgerEntry(tournamentId: string, formData: FormData) {
  const path = `${tournamentBase(tournamentId)}/finance`;
  try {
    const { supabase, profile } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
    const parsed = parseManualLedgerForm(formData);
    if (!parsed.ok) {
      redirectWithFlash(path, "error", parsed.message);
    }
    const { teamId, entryType, amount, description } = parsed.value;
    const { error } = await supabase.from("financial_ledger").insert({
      tournament_id: tournamentId,
      team_id: teamId,
      entry_type: entryType,
      amount,
      description,
      created_by: profile.id,
    });
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Ledger entry saved.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not save entry.");
  }
}

export async function updateLedgerEntry(tournamentId: string, ledgerId: string, formData: FormData) {
  const path = `${tournamentBase(tournamentId)}/finance`;
  try {
    const { supabase } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
    const { data: existing } = await supabase
      .from("financial_ledger")
      .select("id, entry_type")
      .eq("id", ledgerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!existing) redirectWithFlash(path, "error", "Ledger entry not found.");
    if (!isEditableLedgerEntry(existing.entry_type)) {
      redirectWithFlash(path, "error", "This entry cannot be edited.");
    }

    const parsed = parseManualLedgerForm(formData, {
      allowOpeningBalance: existing.entry_type === "opening_balance",
    });
    if (!parsed.ok) {
      redirectWithFlash(path, "error", parsed.message);
    }
    const { teamId, entryType, amount, description } = parsed.value;

    const { error } = await supabase
      .from("financial_ledger")
      .update({
        team_id: teamId,
        entry_type: entryType,
        amount,
        description,
      })
      .eq("id", ledgerId)
      .eq("tournament_id", tournamentId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Ledger entry updated.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not update entry.");
  }
}

export async function deleteLedgerEntry(tournamentId: string, ledgerId: string) {
  const path = `${tournamentBase(tournamentId)}/finance`;
  try {
    const { supabase, profile } = await getSupabase();
    await prepareTournamentWrite(supabase, tournamentId, path);
    const canDelete = await getCanDeleteLedgerForTournament(supabase, tournamentId, profile.id);
    if (!canDelete) {
      redirectWithFlash(path, "error", "You do not have permission to delete ledger entries.");
    }

    const { data: existing } = await supabase
      .from("financial_ledger")
      .select("id, entry_type")
      .eq("id", ledgerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!existing) redirectWithFlash(path, "error", "Ledger entry not found.");
    if (!isDeletableLedgerEntry(existing.entry_type)) {
      redirectWithFlash(path, "error", "This entry cannot be deleted.");
    }

    const { error } = await supabase
      .from("financial_ledger")
      .delete()
      .eq("id", ledgerId)
      .eq("tournament_id", tournamentId);
    if (error) redirectWithFlash(path, "error", error.message);
    redirectWithFlash(path, "success", "Ledger entry deleted.");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirectWithFlash(path, "error", "Could not delete entry.");
  }
}
