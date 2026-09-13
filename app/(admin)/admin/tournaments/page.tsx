import { AdminTournamentsManager } from "@/components/admin-tournaments-manager";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function AdminTournamentsPage() {
  await requireSuperAdmin();
  const supabase = createClient(await cookies());

  const [{ data: tournaments }, { data: organizers }] = await Promise.all([
    supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "organizer")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const organizerById = new Map((organizers ?? []).map((o) => [o.id, o]));

  const rows = (tournaments ?? []).map((t) => {
    const org = organizerById.get(t.organizer_id);
    return {
      ...t,
      organizerLabel: org?.full_name || org?.email || "—",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tournaments" description="List first — use + Create to assign events to organizers." />
      <AdminTournamentsManager tournaments={rows} organizers={organizers ?? []} />
    </div>
  );
}
