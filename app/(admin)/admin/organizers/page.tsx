import { AdminOrganizersManager } from "@/components/admin-organizers-manager";
import { PageHeader } from "@/components/page-header";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function OrganizersPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const [{ data: organizers, error }, { data: tournaments }] = await Promise.all([
    admin
      .from("profiles")
      .select("*")
      .eq("role", "organizer")
      .order("created_at", { ascending: false }),
    admin.from("tournaments").select("id, name, status").order("name"),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizer management"
        description="New accounts do not inherit tournaments automatically — assign the event where teams already exist."
      />
      <AdminOrganizersManager organizers={organizers ?? []} tournaments={tournaments ?? []} />
    </div>
  );
}
