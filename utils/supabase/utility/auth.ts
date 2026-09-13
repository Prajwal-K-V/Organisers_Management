import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile, UserRole } from "@/types/database";

export function getPostLoginPath(role: UserRole): string {
  return role === "super_admin" ? "/admin/dashboard" : "/organizer/dashboard";
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireSuperAdmin(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>; profile: Profile }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/login?error=forbidden");
  }

  return { user, profile };
}

export async function requireOrganizer(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>; profile: Profile }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "organizer" || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return { user, profile };
}
