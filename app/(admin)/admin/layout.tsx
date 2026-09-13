import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/actions/auth";
import { requireSuperAdmin } from "@/utils/supabase/utility/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <AppShell
      title="Admin"
      subtitle="Platform control"
      nav={[
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/organizers", label: "Organizers" },
        { href: "/admin/tournaments", label: "Tournaments" },
      ]}
      signOutAction={signOut}
    >
      {children}
    </AppShell>
  );
}
