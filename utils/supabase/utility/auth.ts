import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile, UserRole } from "@/types/database";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const getRequestAuth = cache(async (): Promise<{
  user: User | null;
  profile: Profile | null;
  supabase: SupabaseClient<Database>;
}> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, supabase };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile: profile ?? null, supabase };
});

export function getPostLoginPath(role: UserRole): string {
  return role === "super_admin" ? "/admin/dashboard" : "/organizer/dashboard";
}

export async function getAuthUser(): Promise<User | null> {
  const { user } = await getRequestAuth();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const { profile } = await getRequestAuth();
  return profile;
}

export async function requireSuperAdmin(): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await getRequestAuth();

  if (!user) redirect("/login");

  if (!profile || profile.role !== "super_admin") {
    redirect("/login?error=forbidden");
  }

  return { user, profile };
}

export async function requireOrganizer(): Promise<{ user: User; profile: Profile }> {
  const { user, profile, supabase } = await getRequestAuth();

  if (!user) redirect("/login");

  if (!profile || profile.role !== "organizer" || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return { user, profile };
}
