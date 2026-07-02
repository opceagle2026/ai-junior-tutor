import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ROLES = ["admin", "teacher"];

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.role ?? null;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPath = pathname === "/login";
  const isNotAuthorizedPath = pathname === "/not-authorized";

  if (isAdminPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);

    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminPath && user) {
    const role = await getUserRole(supabase, user.id);

    if (!role || !ADMIN_ROLES.includes(role)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/not-authorized";
      redirectUrl.search = "";

      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isLoginPath && user) {
    const role = await getUserRole(supabase, user.id);
    const redirectUrl = request.nextUrl.clone();

    if (role && ADMIN_ROLES.includes(role)) {
      redirectUrl.pathname = "/admin/sources";
    } else {
      redirectUrl.pathname = "/not-authorized";
    }

    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  if (isNotAuthorizedPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/not-authorized"],
};