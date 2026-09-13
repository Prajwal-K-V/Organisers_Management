import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/auth/callback");

  let role: UserRole | null = null;
  let isActive = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();
    if (profile) {
      role = profile.role as UserRole;
      isActive = profile.is_active;
    }
  }

  if (user && pathname === "/login") {
    const dest =
      role === "super_admin"
        ? "/admin/dashboard"
        : role === "organizer" && isActive
          ? "/organizer/dashboard"
          : "/login";
    if (dest !== "/login") {
      return redirectWithCookies(new URL(dest, request.url), supabaseResponse);
    }
  }

  if (pathname === "/") {
    if (!user) {
      return redirectWithCookies(new URL("/login", request.url), supabaseResponse);
    }
    if (role === "super_admin") {
      return redirectWithCookies(new URL("/admin/dashboard", request.url), supabaseResponse);
    }
    if (role === "organizer" && isActive) {
      return redirectWithCookies(new URL("/organizer/dashboard", request.url), supabaseResponse);
    }
    return redirectWithCookies(new URL("/login?error=inactive", request.url), supabaseResponse);
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return redirectWithCookies(new URL("/login", request.url), supabaseResponse);
    }
    if (role !== "super_admin") {
      return redirectWithCookies(new URL("/login?error=forbidden", request.url), supabaseResponse);
    }
  }

  if (pathname.startsWith("/organizer")) {
    if (!user) {
      return redirectWithCookies(new URL("/login", request.url), supabaseResponse);
    }
    if (role !== "organizer" || !isActive) {
      return redirectWithCookies(new URL("/login?error=inactive", request.url), supabaseResponse);
    }
  }

  if (!isPublic && !user && (pathname.startsWith("/admin") || pathname.startsWith("/organizer"))) {
    return redirectWithCookies(new URL("/login", request.url), supabaseResponse);
  }

  return supabaseResponse;
}
