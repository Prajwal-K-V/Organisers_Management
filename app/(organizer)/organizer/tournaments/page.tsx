import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TournamentListItem } from "@/components/tournament-list-item";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function TournamentsPage() {
  const { profile } = await requireOrganizer();
  const supabase = createClient(await cookies());
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .eq("organizer_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tournaments"
        description="Select a tournament below to manage teams, players, auction, and finance."
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
