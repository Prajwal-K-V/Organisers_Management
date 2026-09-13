import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/actions/auth";
import { requireOrganizer } from "@/utils/supabase/utility/auth";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  await requireOrganizer();

  return (
    <AppShell
      title="Organizer"
      subtitle="Tournaments & auctions"
      nav={[
        { href: "/organizer/dashboard", label: "Dashboard" },
        { href: "/organizer/tournaments", label: "Tournaments" },
      ]}
      signOutAction={signOut}
    >
      {children}
    </AppShell>
  );
}
