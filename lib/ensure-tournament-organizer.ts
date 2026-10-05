import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const MIGRATION_HINT =
  "Database migrations may be out of date. Apply the latest Supabase migrations and try again.";

function isMissingRpc(error: { message?: string } | null) {
  const msg = error?.message ?? "";
  return msg.includes("Could not find the function") || msg.includes("schema cache");
}

/** Sync junction row for primary organizers; returns an error message when access is denied. */
export async function ensureMyTournamentOrganizer(
  supabase: SupabaseClient<Database>,
  tournamentId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("ensure_my_tournament_organizer", {
    p_tournament_id: tournamentId,
  });
  if (error) {
    if (isMissingRpc(error)) {
      const { data: hasAccess, error: accessError } = await supabase.rpc("organizer_tournament_access", {
        p_tournament_id: tournamentId,
      });
      if (!accessError && hasAccess === true) return null;
      if (isMissingRpc(accessError)) return null;
      if (!accessError && hasAccess !== true) {
        return "You do not have access to this tournament.";
      }
      return accessError?.message ?? MIGRATION_HINT;
    }
    return error.message;
  }
  if (data !== true) {
    return "You do not have access to this tournament.";
  }
  return null;
}
