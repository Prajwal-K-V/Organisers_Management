import { AdminOrganizersManager } from "@/components/admin-organizers-manager";
import { PageHeader } from "@/components/page-header";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function OrganizersPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data: organizers, error } = await admin
    .from("profiles")
    .select("*")
    .eq("role", "organizer")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Organizer management" description="List first — use + Create to add accounts." />
      <AdminOrganizersManager organizers={organizers ?? []} />
    </div>
  );
}
