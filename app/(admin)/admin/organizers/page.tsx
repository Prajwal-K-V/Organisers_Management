import { AdminOrganizersManager } from "@/components/admin-organizers-manager";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function OrganizersPage() {
  await requireSuperAdmin();
  const supabase = createClient(await cookies());
  const { data: organizers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "organizer")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Organizer management" description="List first — use + Create to add accounts." />
      <AdminOrganizersManager organizers={organizers ?? []} />
    </div>
  );
}
