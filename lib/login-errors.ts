const MESSAGES: Record<string, string> = {
  profile:
    "Your account is missing a profile. Ask an admin to run the database migrations, or contact support.",
  inactive:
    "Your organizer account is not active yet. Please contact your administrator.",
  forbidden: "You do not have permission to access that area.",
  auth: "Sign-in failed. Check your email and password.",
  auth_callback: "The sign-in link expired or is invalid. Request a new magic link.",
};

export function humanizeLoginError(code: string | undefined): string | null {
  if (!code) return null;
  if (MESSAGES[code]) return MESSAGES[code];
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}
