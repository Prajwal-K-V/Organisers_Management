import { PlayersManager } from "@/components/players-manager";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOrganizer();
  const { id: tournamentId } = await params;
  const [{ data: players }, { data: teams }] = await Promise.all([
    supabase.from("players").select("*").eq("tournament_id", tournamentId).order("player_code"),
    supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name"),
  ]);

  return (
    <PlayersManager
      tournamentId={tournamentId}
      players={players ?? []}
      teams={teams ?? []}
    />
  );
}
