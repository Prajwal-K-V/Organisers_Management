import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Sync junction row for primary organizers; no-op if already linked. */
export async function ensureMyTournamentOrganizer(
  supabase: SupabaseClient<Database>,
  tournamentId: string
) {
  const { error } = await supabase.rpc("ensure_my_tournament_organizer", {
    p_tournament_id: tournamentId,
  });
  if (error && !error.message.includes("Could not find the function")) {
    return error;
  }
  return null;
}
