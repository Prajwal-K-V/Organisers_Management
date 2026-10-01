import { TeamsManager } from "@/components/teams-manager";
import {
  fetchOrganizerPlayerRosterBits,
  fetchOrganizerTeams,
} from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOrganizer();
  const { id: tournamentId } = await params;
  const [teams, players] = await Promise.all([
    fetchOrganizerTeams(supabase, tournamentId),
    fetchOrganizerPlayerRosterBits(supabase, tournamentId),
  ]);

  return <TeamsManager tournamentId={tournamentId} teams={teams} players={players} />;
}
