import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/admin";

export type SessionProfile = {
  role: UserRole;
  is_active: boolean;
};

export async function getSessionProfile(
  supabase: SupabaseClient<Database>
): Promise<{ profile: SessionProfile | null; errorMessage: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, errorMessage: "Not signed in" };
  }

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { profile: existing, errorMessage: null };
  }

  if (selectError && selectError.code !== "PGRST116") {
    const hint =
      selectError.message.includes("profiles") || selectError.code === "42P01"
        ? "Run supabase/migrations SQL in your Supabase project (profiles table missing)."
        : selectError.message;
    return { profile: null, errorMessage: hint };
  }

  const { data: ensured, error: rpcError } = await supabase.rpc("ensure_profile");
  if (ensured) {
    return {
      profile: { role: ensured.role, is_active: ensured.is_active },
      errorMessage: null,
    };
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data: upserted, error: upsertError } = await admin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? "",
            full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
            role: "organizer",
            is_active: false,
          },
          { onConflict: "id" }
        )
        .select("role, is_active")
        .single();

      if (upserted && !upsertError) {
        return { profile: upserted, errorMessage: null };
      }
    } catch {
      // fall through
    }
  }

  const rpcHint = rpcError?.message?.includes("ensure_profile")
    ? "Apply migration 20250913100000_ensure_profile.sql in Supabase SQL editor."
    : rpcError?.message;

  return {
    profile: null,
    errorMessage:
      rpcHint ??
      "No profile for this account. Add a row in public.profiles or run ensure_profile migration.",
  };
}
