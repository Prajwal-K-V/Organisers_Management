import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TournamentListItem } from "@/components/tournament-list-item";
import { Card } from "@/components/ui/card";
import { fetchOrganizerTournaments } from "@/lib/organizer-queries";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TournamentsPage() {
  const { supabase } = await requireOrganizer();
  const tournaments = await fetchOrganizerTournaments(supabase);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tournaments"
        description="New tournaments start as draft. Open one → Overview → Publish tournament when you are ready to go live."
      />

      {!tournaments?.length ? (
        <EmptyState
          title="No tournaments assigned yet"
          description="Your admin will create tournaments and assign them to you. Check back here or contact your administrator."
        />
      ) : (
        <Card className="space-y-3 border-2 border-[var(--border-subtle)] bg-[var(--accent-soft)]/20">
          <p className="text-sm font-medium text-[var(--accent-foreground)]">
            {tournaments.length} tournament{tournaments.length === 1 ? "" : "s"} — click a card to open
          </p>
          <ul className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <li key={t.id}>
                <TournamentListItem
                  href={`/organizer/tournaments/${t.id}`}
                  name={t.name}
                  status={t.status}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
