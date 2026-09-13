import { getProfile, getAuthUser } from "@/utils/supabase/utility/auth";

/** @deprecated Use requireOrganizer or getProfile instead */
export async function getCurrentUser() {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await getProfile();
  if (!profile) return null;

  if (profile.role === "organizer" && !profile.is_active) {
    return null;
  }

  return { user, profile };
}
