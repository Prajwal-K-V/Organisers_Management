import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getCanDeleteLedgerForTournament(
  supabase: SupabaseClient<Database>,
  tournamentId: string,
  profileId: string
) {
  const { data } = await supabase
    .from("tournament_organizers")
    .select("can_delete_ledger")
    .eq("tournament_id", tournamentId)
    .eq("profile_id", profileId)
    .maybeSingle();

  return Boolean(data?.can_delete_ledger);
}
