"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authMetadataFromProfile } from "@/lib/auth-metadata";
import { getPostLoginPath } from "@/utils/supabase/utility/auth";
import { getSessionProfile } from "@/utils/supabase/utility/profile";

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const { profile, errorMessage } = await getSessionProfile(supabase);
  if (!profile) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent(errorMessage ?? "profile")}`);
  }

  if (profile.role === "organizer" && !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  await supabase.auth.updateUser({ data: authMetadataFromProfile(profile) });

  redirect(getPostLoginPath(profile.role));
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Check your email for the magic link");
}
