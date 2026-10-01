import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Sync junction row for primary organizers; returns an error message when access is denied. */
export async function ensureMyTournamentOrganizer(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<string | null> {
  const { data: hasAccess, error: accessError } = await supabase.rpc("organizer_tournament_access", {
    p_tournament_id: tournamentId,
  });
  if (!accessError && hasAccess === true) {
    return null;
  }

  const { data, error } = await supabase.rpc("ensure_my_tournament_organizer", {
    p_tournament_id: tournamentId,
  });
  if (error) {
    if (error.message.includes("Could not find the function")) return null;
    return error.message;
  }
  if (data !== true) {
    return "You do not have access to this tournament.";
  }
  return null;
}
