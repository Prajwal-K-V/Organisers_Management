import type { UserRole } from "@/types/database";

export const AUTH_ROLE_KEY = "app_role";
export const AUTH_ACTIVE_KEY = "app_is_active";

export function authMetadataFromProfile(profile: { role: UserRole; is_active: boolean }) {
  return {
    [AUTH_ROLE_KEY]: profile.role,
    [AUTH_ACTIVE_KEY]: profile.is_active,
  };
}

export function roleFromUserMetadata(metadata: Record<string, unknown> | undefined): UserRole | null {
  const role = metadata?.[AUTH_ROLE_KEY];
  if (role === "super_admin" || role === "organizer") return role;
  return null;
}

export function isActiveFromUserMetadata(metadata: Record<string, unknown> | undefined): boolean | null {
  const v = metadata?.[AUTH_ACTIVE_KEY];
  if (typeof v === "boolean") return v;
  return null;
}
