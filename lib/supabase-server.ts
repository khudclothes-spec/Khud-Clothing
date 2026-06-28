import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client — use in Server Components, Route Handlers, and Server Actions.
 * Must be called inside an async context (await cookies() requires Next.js 15+).
 * Never import this in "use client" components.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookie mutation is a no-op here.
            // Middleware handles refresh writes.
          }
        }
      }
    }
  );
}

/**
 * Admin Supabase client using the service-role key.
 * Bypasses RLS. Use only in trusted server-only contexts (scripts, API routes).
 * NEVER expose the service-role key to the browser.
 */
export function createAdminClient() {
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {}
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
