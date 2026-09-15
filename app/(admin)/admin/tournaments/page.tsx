import { AdminTournamentsManager } from "@/components/admin-tournaments-manager";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function AdminTournamentsPage() {
  await requireSuperAdmin();
  const supabase = createClient(await cookies());

  const [{ data: tournaments }, { data: allOrganizers }] = await Promise.all([
    supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email, is_active")
      .eq("role", "organizer")
      .order("full_name"),
  ]);

  const organizers = (allOrganizers ?? []).filter((o) => o.is_active);
  const organizerById = new Map((allOrganizers ?? []).map((o) => [o.id, o]));

  const rows = (tournaments ?? []).map((t) => {
    const org = organizerById.get(t.organizer_id);
    return {
      ...t,
      organizerLabel: org
        ? `${org.full_name || org.email}${org.is_active ? "" : " (inactive)"}`
        : "Unassigned",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tournaments"
        description="Create a tournament with an organizer, or use Assign on an existing row to change who runs it."
      />
      <AdminTournamentsManager tournaments={rows} organizers={organizers ?? []} />
    </div>
  );
}
