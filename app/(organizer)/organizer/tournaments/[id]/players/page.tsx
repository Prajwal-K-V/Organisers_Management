import { PlayersManager } from "@/components/players-manager";
import { fetchOrganizerPlayers, fetchOrganizerTeams } from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOrganizer();
  const { id: tournamentId } = await params;
  const [players, teams] = await Promise.all([
    fetchOrganizerPlayers(supabase, tournamentId),
    fetchOrganizerTeams(supabase, tournamentId),
  ]);

  return (
    <PlayersManager
      tournamentId={tournamentId}
      players={players}
      teams={teams}
    />
  );
}
