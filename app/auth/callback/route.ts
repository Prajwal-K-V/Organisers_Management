import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authMetadataFromProfile } from "@/lib/auth-metadata";
import { getPostLoginPath } from "@/utils/supabase/utility/auth";
import { getSessionProfile } from "@/utils/supabase/utility/profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { profile, errorMessage } = await getSessionProfile(supabase);
      if (profile) {
        if (profile.role === "organizer" && !profile.is_active) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=inactive`);
        }
        await supabase.auth.updateUser({ data: authMetadataFromProfile(profile) });
        return NextResponse.redirect(`${origin}${getPostLoginPath(profile.role)}`);
      }
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(errorMessage ?? "profile")}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
