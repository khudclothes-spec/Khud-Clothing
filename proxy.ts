import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // getUser() validates the JWT server-side — never use getSession() in proxy.
  // A stale/missing refresh token makes the SSR client throw
  // (AuthApiError: refresh_token_not_found). Treat that as "no user" and clear
  // the dead auth cookies so the browser stops replaying them every request.
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
    else if (error.code === "refresh_token_not_found" || error.status === 400) {
      clearAuthCookies(request, supabaseResponse);
    }
  } catch {
    clearAuthCookies(request, supabaseResponse);
  }

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Remove Supabase auth cookies (sb-*) from the response when the session is
// unrecoverable, so the invalid-refresh-token error doesn't repeat on every load.
function clearAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  });
}

export const config = {
  matcher: ["/admin/:path*"]
};
