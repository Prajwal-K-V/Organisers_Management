import { AdminTournamentsManager } from "@/components/admin-tournaments-manager";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function AdminTournamentsPage() {
  await requireSuperAdmin();
  const supabase = createClient(await cookies());

  const [{ data: tournaments }, { data: allOrganizers }, { data: assignments }] = await Promise.all([
    supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email, is_active")
      .eq("role", "organizer")
      .order("full_name"),
    supabase.from("tournament_organizers").select("tournament_id, profile_id, can_delete_ledger"),
  ]);

  const organizers = (allOrganizers ?? []).filter((o) => o.is_active);
  const organizerById = new Map((allOrganizers ?? []).map((o) => [o.id, o]));

  const assignedByTournament = new Map<
    string,
    { profile_id: string; can_delete_ledger: boolean }[]
  >();
  for (const row of assignments ?? []) {
    const list = assignedByTournament.get(row.tournament_id) ?? [];
    list.push({
      profile_id: row.profile_id,
      can_delete_ledger: row.can_delete_ledger,
    });
    assignedByTournament.set(row.tournament_id, list);
  }

  const rows = (tournaments ?? []).map((t) => {
    const assigned = [...(assignedByTournament.get(t.id) ?? [])];
    if (t.organizer_id && !assigned.some((a) => a.profile_id === t.organizer_id)) {
      assigned.unshift({ profile_id: t.organizer_id, can_delete_ledger: true });
    }
    const labels = assigned.map(({ profile_id: id }) => {
      const org = organizerById.get(id);
      if (!org) return "Unknown";
      return `${org.full_name || org.email}${org.is_active ? "" : " (inactive)"}`;
    });
    return {
      ...t,
      assignedOrganizers: assigned,
      organizerLabel: labels.length ? labels.join(", ") : "Unassigned",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tournaments"
        description="Create a tournament with an organizer, or add more organizers on an existing row without removing others."
      />
      <AdminTournamentsManager tournaments={rows} organizers={organizers ?? []} />
    </div>
  );
}
