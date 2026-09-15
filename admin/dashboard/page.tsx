import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function AdminDashboardPage() {
  await requireSuperAdmin();
  const supabase = createClient(await cookies());
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "organizer");

  return (
    <div>
      <PageHeader title="Admin dashboard" description="Overview of platform organizers" />
      <Card>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-foreground)]">
          Total organizers
        </p>
        <p className="stat-value mt-2">{count ?? 0}</p>
      </Card>
    </div>
  );
}
