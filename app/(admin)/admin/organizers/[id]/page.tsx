import { notFound } from "next/navigation";
import Link from "next/link";
import { updateOrganizerProfile } from "@/app/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function OrganizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = createClient(await cookies());
  const { data: organizer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "organizer")
    .single();

  if (!organizer) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/organizers" className="text-sm font-medium text-[var(--primary)] hover:underline">
        ← Back to organizers
      </Link>
      <Card className="max-w-lg space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="page-title text-xl">Edit organizer</h1>
          <Badge variant={organizer.is_active ? "success" : "muted"}>
            {organizer.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <form action={updateOrganizerProfile} className="space-y-4">
          <input type="hidden" name="id" value={organizer.id} />
          <Field label="Full name" name="full_name" defaultValue={organizer.full_name ?? ""} />
          <div>
            <p className="text-sm font-medium text-stone-800">Email</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{organizer.email}</p>
          </div>
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
